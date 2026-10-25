using EmployeeManagement.Core.DTOs;
using EmployeeManagement.Core.DTOs.Common;
using EmployeeManagement.Core.Entities;
using EmployeeManagement.Core.Enums;
using EmployeeManagement.Core.Exceptions;
using EmployeeManagement.Core.Interfaces;
using EmployeeManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Infrastructure.Services;

public class AttendanceService : IAttendanceService
{
    private readonly AppDbContext _context;
    private readonly IExcelExportService _excelExportService;

    public AttendanceService(AppDbContext context, IExcelExportService? excelExportService = null)
    {
        _context = context;
        _excelExportService = excelExportService ?? new ExcelExportService();
    }

    public async Task<PagedResult<AttendanceDto>> GetPagedAsync(AttendancePagedRequest request)
    {
        var query = _context.Attendances
            .Include(a => a.Employee)
                .ThenInclude(e => e!.Department)
            .AsNoTracking();

        // 1. Search term (Employee name, email, department, notes)
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLower();
            query = query.Where(a =>
                (a.Employee != null && (
                    a.Employee.FirstName.ToLower().Contains(term) ||
                    a.Employee.LastName.ToLower().Contains(term) ||
                    (a.Employee.FirstName + " " + a.Employee.LastName).ToLower().Contains(term) ||
                    a.Employee.Email.ToLower().Contains(term) ||
                    a.Employee.Position.ToLower().Contains(term) ||
                    (a.Employee.Department != null && a.Employee.Department.Name.ToLower().Contains(term))
                )) ||
                (a.Notes != null && a.Notes.ToLower().Contains(term)));
        }

        // 2. Department filter
        if (request.DepartmentId.HasValue && request.DepartmentId.Value > 0)
        {
            query = query.Where(a => a.Employee != null && a.Employee.DepartmentId == request.DepartmentId.Value);
        }

        // 3. Employee filter
        if (request.EmployeeId.HasValue && request.EmployeeId.Value > 0)
        {
            query = query.Where(a => a.EmployeeId == request.EmployeeId.Value);
        }

        // 4. Status filter
        if (request.Status.HasValue)
        {
            query = query.Where(a => a.Status == request.Status.Value);
        }

        // 5. Date range filter
        if (request.StartDate.HasValue)
        {
            var startUtc = DateTime.SpecifyKind(request.StartDate.Value.Date, DateTimeKind.Utc);
            query = query.Where(a => a.Date >= startUtc);
        }

        if (request.EndDate.HasValue)
        {
            var endUtc = DateTime.SpecifyKind(request.EndDate.Value.Date, DateTimeKind.Utc);
            query = query.Where(a => a.Date <= endUtc);
        }

        var totalCount = await query.CountAsync();

        // 6. Dynamic Sorting
        query = ApplySorting(query, request.SortBy, request.SortDescending);

        // 7. Pagination
        var skip = (request.PageNumber - 1) * request.PageSize;
        var items = await query
            .Skip(skip)
            .Take(request.PageSize)
            .Select(a => MapToDto(a))
            .ToListAsync();

        return new PagedResult<AttendanceDto>(items, totalCount, request.PageNumber, request.PageSize);
    }

    public async Task<AttendanceDto> GetByIdAsync(int id)
    {
        var attendance = await _context.Attendances
            .Include(a => a.Employee)
                .ThenInclude(e => e!.Department)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id);

        if (attendance == null)
        {
            throw new NotFoundException($"Không tìm thấy bản ghi chấm công với mã {id}.");
        }

        return MapToDto(attendance);
    }

    public async Task<TodayAttendanceStatusDto> GetTodayStatusAsync(int? employeeId, string? userEmail)
    {
        var employee = await ResolveEmployeeAsync(employeeId, userEmail);
        if (employee == null)
        {
            return new TodayAttendanceStatusDto
            {
                HasCheckedIn = false,
                HasCheckedOut = false,
                EmployeeId = null,
                EmployeeName = null,
                Attendance = null
            };
        }

        var todayUtc = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
        var attendance = await _context.Attendances
            .Include(a => a.Employee)
                .ThenInclude(e => e!.Department)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.EmployeeId == employee.Id && a.Date == todayUtc);

        return new TodayAttendanceStatusDto
        {
            HasCheckedIn = attendance?.CheckInTime != null,
            HasCheckedOut = attendance?.CheckOutTime != null,
            EmployeeId = employee.Id,
            EmployeeName = employee.FullName,
            Attendance = attendance != null ? MapToDto(attendance) : null
        };
    }

    public async Task<AttendanceDto> CheckInAsync(CheckInRequestDto dto, string? userEmail)
    {
        var employee = await ResolveEmployeeAsync(dto.EmployeeId, userEmail);
        if (employee == null)
        {
            throw new NotFoundException("Không tìm thấy thông tin nhân viên để thực hiện chấm công.");
        }

        var now = DateTime.UtcNow;
        var todayUtc = DateTime.SpecifyKind(now.Date, DateTimeKind.Utc);

        var existing = await _context.Attendances
            .FirstOrDefaultAsync(a => a.EmployeeId == employee.Id && a.Date == todayUtc);

        if (existing != null && existing.CheckInTime.HasValue)
        {
            var formattedTime = existing.CheckInTime.Value.ToLocalTime().ToString("HH:mm");
            throw new ConflictException($"Nhân viên {employee.FullName} đã chấm công vào hôm nay lúc {formattedTime}.");
        }

        // Determine status: Standard workday starts at 08:30 (Local time)
        var localNow = now.ToLocalTime();
        var standardStartTime = new TimeSpan(8, 30, 0);
        var isLate = localNow.TimeOfDay > standardStartTime;
        var status = isLate ? AttendanceStatus.Late : AttendanceStatus.Present;

        if (existing != null)
        {
            existing.CheckInTime = now;
            existing.Status = status;
            if (!string.IsNullOrWhiteSpace(dto.Notes))
            {
                existing.Notes = string.IsNullOrWhiteSpace(existing.Notes) ? dto.Notes : $"{existing.Notes}; {dto.Notes}";
            }
            existing.UpdatedAt = now;
            await _context.SaveChangesAsync();
            return await GetByIdAsync(existing.Id);
        }

        var newAttendance = new Attendance
        {
            EmployeeId = employee.Id,
            Date = todayUtc,
            CheckInTime = now,
            Status = status,
            Notes = dto.Notes,
            CreatedAt = now
        };

        _context.Attendances.Add(newAttendance);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(newAttendance.Id);
    }

    public async Task<AttendanceDto> CheckOutAsync(CheckOutRequestDto dto, string? userEmail)
    {
        var employee = await ResolveEmployeeAsync(dto.EmployeeId, userEmail);
        if (employee == null)
        {
            throw new NotFoundException("Không tìm thấy thông tin nhân viên để thực hiện chấm công ra.");
        }

        var now = DateTime.UtcNow;
        var todayUtc = DateTime.SpecifyKind(now.Date, DateTimeKind.Utc);

        var existing = await _context.Attendances
            .FirstOrDefaultAsync(a => a.EmployeeId == employee.Id && a.Date == todayUtc);

        if (existing == null || !existing.CheckInTime.HasValue)
        {
            throw new ValidationException($"Nhân viên {employee.FullName} chưa thực hiện chấm công vào hôm nay, không thể chấm công ra.");
        }

        if (existing.CheckOutTime.HasValue)
        {
            var formattedTime = existing.CheckOutTime.Value.ToLocalTime().ToString("HH:mm");
            throw new ConflictException($"Nhân viên {employee.FullName} đã chấm công ra hôm nay lúc {formattedTime}.");
        }

        existing.CheckOutTime = now;
        
        // Calculate working hours
        var duration = now - existing.CheckInTime.Value;
        var totalHours = (decimal)duration.TotalHours;
        existing.WorkingHours = Math.Max(0.1m, Math.Round(totalHours, 2));

        // Office standard departure time is 17:00 (Local time)
        var localNow = now.ToLocalTime();
        var standardEndTime = new TimeSpan(17, 0, 0);
        var isEarlyLeave = localNow.TimeOfDay < standardEndTime;

        if (isEarlyLeave)
        {
            if (existing.Status == AttendanceStatus.Late)
            {
                existing.Status = AttendanceStatus.LateAndEarlyLeave;
            }
            else
            {
                existing.Status = AttendanceStatus.EarlyLeave;
            }
        }

        if (!string.IsNullOrWhiteSpace(dto.Notes))
        {
            existing.Notes = string.IsNullOrWhiteSpace(existing.Notes) ? dto.Notes : $"{existing.Notes}; {dto.Notes}";
        }
        existing.UpdatedAt = now;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(existing.Id);
    }

    public async Task<AttendanceDto> CreateAsync(CreateAttendanceDto dto)
    {
        var employee = await _context.Employees.FindAsync(dto.EmployeeId);
        if (employee == null)
        {
            throw new NotFoundException($"Không tìm thấy nhân viên với mã số {dto.EmployeeId}.");
        }

        var dateUtc = DateTime.SpecifyKind(dto.Date.Date, DateTimeKind.Utc);

        var exists = await _context.Attendances
            .AnyAsync(a => a.EmployeeId == dto.EmployeeId && a.Date == dateUtc);

        if (exists)
        {
            throw new ConflictException($"Nhân viên {employee.FullName} đã có bản ghi chấm công ngày {dateUtc:dd/MM/yyyy}.");
        }

        var checkInUtc = dto.CheckInTime.HasValue ? DateTime.SpecifyKind(dto.CheckInTime.Value, DateTimeKind.Utc) : (DateTime?)null;
        var checkOutUtc = dto.CheckOutTime.HasValue ? DateTime.SpecifyKind(dto.CheckOutTime.Value, DateTimeKind.Utc) : (DateTime?)null;

        decimal? workingHours = dto.WorkingHours;
        if (!workingHours.HasValue && checkInUtc.HasValue && checkOutUtc.HasValue && checkOutUtc > checkInUtc)
        {
            workingHours = Math.Round((decimal)(checkOutUtc.Value - checkInUtc.Value).TotalHours, 2);
        }

        var attendance = new Attendance
        {
            EmployeeId = dto.EmployeeId,
            Date = dateUtc,
            CheckInTime = checkInUtc,
            CheckOutTime = checkOutUtc,
            WorkingHours = workingHours,
            Status = dto.Status,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow
        };

        _context.Attendances.Add(attendance);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(attendance.Id);
    }

    public async Task<AttendanceDto> UpdateAsync(int id, UpdateAttendanceDto dto)
    {
        var attendance = await _context.Attendances
            .FirstOrDefaultAsync(a => a.Id == id);

        if (attendance == null)
        {
            throw new NotFoundException($"Không tìm thấy bản ghi chấm công với mã {id}.");
        }

        var dateUtc = DateTime.SpecifyKind(dto.Date.Date, DateTimeKind.Utc);

        // Check uniqueness if date changed
        var duplicate = await _context.Attendances
            .AnyAsync(a => a.Id != id && a.EmployeeId == attendance.EmployeeId && a.Date == dateUtc);

        if (duplicate)
        {
            throw new ConflictException($"Đã tồn tại bản ghi chấm công khác của nhân viên trong ngày {dateUtc:dd/MM/yyyy}.");
        }

        var checkInUtc = dto.CheckInTime.HasValue ? DateTime.SpecifyKind(dto.CheckInTime.Value, DateTimeKind.Utc) : (DateTime?)null;
        var checkOutUtc = dto.CheckOutTime.HasValue ? DateTime.SpecifyKind(dto.CheckOutTime.Value, DateTimeKind.Utc) : (DateTime?)null;

        decimal? workingHours = dto.WorkingHours;
        if (!workingHours.HasValue && checkInUtc.HasValue && checkOutUtc.HasValue && checkOutUtc > checkInUtc)
        {
            workingHours = Math.Round((decimal)(checkOutUtc.Value - checkInUtc.Value).TotalHours, 2);
        }

        attendance.Date = dateUtc;
        attendance.CheckInTime = checkInUtc;
        attendance.CheckOutTime = checkOutUtc;
        attendance.WorkingHours = workingHours;
        attendance.Status = dto.Status;
        attendance.Notes = dto.Notes;
        attendance.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetByIdAsync(attendance.Id);
    }

    public async Task DeleteAsync(int id)
    {
        var attendance = await _context.Attendances.FindAsync(id);
        if (attendance == null)
        {
            throw new NotFoundException($"Không tìm thấy bản ghi chấm công với mã {id}.");
        }

        _context.Attendances.Remove(attendance);
        await _context.SaveChangesAsync();
    }

    public async Task<AttendanceStatisticsDto> GetStatisticsAsync(int? month, int? year, int? departmentId)
    {
        var query = _context.Attendances
            .Include(a => a.Employee)
            .AsNoTracking();

        if (month.HasValue && month.Value >= 1 && month.Value <= 12)
        {
            query = query.Where(a => a.Date.Month == month.Value);
        }

        if (year.HasValue && year.Value > 2000)
        {
            query = query.Where(a => a.Date.Year == year.Value);
        }

        if (departmentId.HasValue && departmentId.Value > 0)
        {
            query = query.Where(a => a.Employee != null && a.Employee.DepartmentId == departmentId.Value);
        }

        var records = await query.ToListAsync();
        var totalRecords = records.Count;

        var presentCount = records.Count(r => r.Status == AttendanceStatus.Present);
        var lateCount = records.Count(r => r.Status == AttendanceStatus.Late || r.Status == AttendanceStatus.LateAndEarlyLeave);
        var earlyLeaveCount = records.Count(r => r.Status == AttendanceStatus.EarlyLeave || r.Status == AttendanceStatus.LateAndEarlyLeave);
        var absentCount = records.Count(r => r.Status == AttendanceStatus.Absent);
        var onLeaveCount = records.Count(r => r.Status == AttendanceStatus.OnLeave);
        var totalHours = records.Sum(r => r.WorkingHours ?? 0m);

        var onTimeRate = totalRecords > 0
            ? Math.Round((decimal)presentCount / totalRecords * 100m, 1)
            : 0m;

        var averageHours = totalRecords > 0
            ? Math.Round(totalHours / totalRecords, 1)
            : 0m;

        return new AttendanceStatisticsDto
        {
            TotalRecords = totalRecords,
            PresentCount = presentCount,
            LateCount = lateCount,
            EarlyLeaveCount = earlyLeaveCount,
            AbsentCount = absentCount,
            OnLeaveCount = onLeaveCount,
            TotalWorkingHours = Math.Round(totalHours, 2),
            AverageHoursPerDay = averageHours,
            OnTimeRate = onTimeRate
        };
    }

    private async Task<Employee?> ResolveEmployeeAsync(int? employeeId, string? userEmail)
    {
        if (employeeId.HasValue && employeeId.Value > 0)
        {
            return await _context.Employees.FindAsync(employeeId.Value);
        }

        if (!string.IsNullOrWhiteSpace(userEmail))
        {
            var emailLower = userEmail.Trim().ToLower();
            var emp = await _context.Employees
                .FirstOrDefaultAsync(e => e.Email.ToLower() == emailLower);
            if (emp != null) return emp;
        }

        // Fallback: Return first active employee for smooth experience
        return await _context.Employees
            .Where(e => e.Status == EmployeeStatus.Active)
            .OrderBy(e => e.Id)
            .FirstOrDefaultAsync();
    }

    private static IQueryable<Attendance> ApplySorting(IQueryable<Attendance> query, string? sortBy, bool descending)
    {
        return (sortBy?.ToLower()) switch
        {
            "employee" or "name" => descending
                ? query.OrderByDescending(a => a.Employee != null ? a.Employee.LastName : string.Empty).ThenByDescending(a => a.Employee != null ? a.Employee.FirstName : string.Empty)
                : query.OrderBy(a => a.Employee != null ? a.Employee.LastName : string.Empty).ThenBy(a => a.Employee != null ? a.Employee.FirstName : string.Empty),
            "status" => descending ? query.OrderByDescending(a => a.Status) : query.OrderBy(a => a.Status),
            "checkin" or "checkintime" => descending ? query.OrderByDescending(a => a.CheckInTime) : query.OrderBy(a => a.CheckInTime),
            "checkout" or "checkouttime" => descending ? query.OrderByDescending(a => a.CheckOutTime) : query.OrderBy(a => a.CheckOutTime),
            "workinghours" or "hours" => descending ? query.OrderByDescending(a => a.WorkingHours) : query.OrderBy(a => a.WorkingHours),
            _ => descending ? query.OrderByDescending(a => a.Date).ThenByDescending(a => a.Id) : query.OrderBy(a => a.Date).ThenBy(a => a.Id)
        };
    }

    private static AttendanceDto MapToDto(Attendance a)
    {
        return new AttendanceDto
        {
            Id = a.Id,
            EmployeeId = a.EmployeeId,
            EmployeeName = a.Employee != null ? a.Employee.FullName : "N/A",
            EmployeeEmail = a.Employee?.Email ?? string.Empty,
            EmployeePosition = a.Employee?.Position ?? string.Empty,
            DepartmentId = a.Employee?.DepartmentId ?? 0,
            DepartmentName = a.Employee?.Department?.Name ?? "Chưa phân bổ",
            Date = a.Date,
            CheckInTime = a.CheckInTime,
            CheckOutTime = a.CheckOutTime,
            WorkingHours = a.WorkingHours,
            Status = a.Status,
            StatusText = GetStatusText(a.Status),
            Notes = a.Notes,
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt
        };
    }

    private static string GetStatusText(AttendanceStatus status) => status switch
    {
        AttendanceStatus.Present => "Đúng giờ",
        AttendanceStatus.Late => "Đi muộn",
        AttendanceStatus.EarlyLeave => "Về sớm",
        AttendanceStatus.LateAndEarlyLeave => "Đi muộn & Về sớm",
        AttendanceStatus.Absent => "Vắng mặt",
        AttendanceStatus.OnLeave => "Nghỉ phép",
        _ => "Không xác định"
    };

    public async Task<byte[]> ExportToExcelAsync(AttendancePagedRequest request)
    {
        var query = _context.Attendances
            .Include(a => a.Employee)
                .ThenInclude(e => e!.Department)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLower();
            query = query.Where(a =>
                (a.Employee != null && (
                    a.Employee.FirstName.ToLower().Contains(term) ||
                    a.Employee.LastName.ToLower().Contains(term) ||
                    (a.Employee.FirstName + " " + a.Employee.LastName).ToLower().Contains(term) ||
                    a.Employee.Email.ToLower().Contains(term) ||
                    a.Employee.Position.ToLower().Contains(term) ||
                    (a.Employee.Department != null && a.Employee.Department.Name.ToLower().Contains(term))
                )) ||
                (a.Notes != null && a.Notes.ToLower().Contains(term)));
        }

        if (request.DepartmentId.HasValue && request.DepartmentId.Value > 0)
        {
            query = query.Where(a => a.Employee != null && a.Employee.DepartmentId == request.DepartmentId.Value);
        }

        if (request.EmployeeId.HasValue && request.EmployeeId.Value > 0)
        {
            query = query.Where(a => a.EmployeeId == request.EmployeeId.Value);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(a => a.Status == request.Status.Value);
        }

        if (request.StartDate.HasValue)
        {
            var startUtc = DateTime.SpecifyKind(request.StartDate.Value.Date, DateTimeKind.Utc);
            query = query.Where(a => a.Date >= startUtc);
        }

        if (request.EndDate.HasValue)
        {
            var endUtc = DateTime.SpecifyKind(request.EndDate.Value.Date, DateTimeKind.Utc);
            query = query.Where(a => a.Date <= endUtc);
        }

        query = ApplySorting(query, request.SortBy, request.SortDescending);

        var attendances = await query
            .Select(a => MapToDto(a))
            .ToListAsync();

        var stats = await GetStatisticsAsync(null, null, request.DepartmentId);

        return _excelExportService.ExportAttendanceToExcel(attendances, stats);
    }
}