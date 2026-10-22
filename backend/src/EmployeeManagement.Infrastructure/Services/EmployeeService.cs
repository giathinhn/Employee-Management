using EmployeeManagement.Core.DTOs;
using EmployeeManagement.Core.DTOs.Common;
using EmployeeManagement.Core.Entities;
using EmployeeManagement.Core.Enums;
using EmployeeManagement.Core.Exceptions;
using EmployeeManagement.Core.Interfaces;
using EmployeeManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Infrastructure.Services;

public class EmployeeService : IEmployeeService
{
    private readonly AppDbContext _context;

    public EmployeeService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<EmployeeDto>> GetPagedAsync(PagedRequest request)
    {
        var query = _context.Employees
            .Include(e => e.Department)
            .AsNoTracking();

        // 1. Search term filter
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLower();
            query = query.Where(e =>
                e.FirstName.ToLower().Contains(term) ||
                e.LastName.ToLower().Contains(term) ||
                (e.FirstName + " " + e.LastName).ToLower().Contains(term) ||
                e.Email.ToLower().Contains(term) ||
                (e.PhoneNumber != null && e.PhoneNumber.Contains(term)) ||
                e.Position.ToLower().Contains(term) ||
                (e.Department != null && e.Department.Name.ToLower().Contains(term)));
        }

        // 2. Department filter
        if (request.DepartmentId.HasValue && request.DepartmentId.Value > 0)
        {
            query = query.Where(e => e.DepartmentId == request.DepartmentId.Value);
        }

        // 3. Status filter
        if (request.Status.HasValue)
        {
            query = query.Where(e => e.Status == request.Status.Value);
        }

        // 4. Salary range filter
        if (request.MinSalary.HasValue)
        {
            query = query.Where(e => e.Salary >= request.MinSalary.Value);
        }
        if (request.MaxSalary.HasValue)
        {
            query = query.Where(e => e.Salary <= request.MaxSalary.Value);
        }

        // Total count before pagination
        var totalCount = await query.CountAsync();

        // 5. Dynamic Sorting
        query = ApplySorting(query, request.SortBy, request.SortDescending);

        // 6. Pagination
        var skip = (request.PageNumber - 1) * request.PageSize;
        var items = await query
            .Skip(skip)
            .Take(request.PageSize)
            .Select(e => MapToDto(e))
            .ToListAsync();

        return new PagedResult<EmployeeDto>(items, totalCount, request.PageNumber, request.PageSize);
    }

    public async Task<EmployeeDto> GetByIdAsync(int id)
    {
        var emp = await _context.Employees
            .Include(e => e.Department)
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id);

        if (emp == null)
        {
            throw new NotFoundException($"Không tìm thấy nhân viên với mã số {id}.");
        }

        return MapToDto(emp);
    }

    public async Task<EmployeeDto> CreateAsync(CreateEmployeeDto dto)
    {
        var emailLower = dto.Email.Trim().ToLower();

        // Verify department exists
        var departmentExists = await _context.Departments.AnyAsync(d => d.Id == dto.DepartmentId);
        if (!departmentExists)
        {
            throw new NotFoundException($"Phòng ban với mã số {dto.DepartmentId} không tồn tại.");
        }

        // Verify email uniqueness
        if (await _context.Employees.AnyAsync(e => e.Email.ToLower() == emailLower))
        {
            throw new ConflictException($"Email '{dto.Email}' đã được sử dụng bởi một nhân viên khác.");
        }

        var employee = new Employee
        {
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            Email = emailLower,
            PhoneNumber = dto.PhoneNumber?.Trim(),
            DateOfBirth = DateTime.SpecifyKind(dto.DateOfBirth, DateTimeKind.Utc),
            HireDate = DateTime.SpecifyKind(dto.HireDate, DateTimeKind.Utc),
            Position = dto.Position.Trim(),
            Salary = dto.Salary,
            Status = dto.Status,
            DepartmentId = dto.DepartmentId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        // Load department name
        await _context.Entry(employee).Reference(e => e.Department).LoadAsync();

        return MapToDto(employee);
    }

    public async Task<EmployeeDto> UpdateAsync(int id, UpdateEmployeeDto dto)
    {
        var emp = await _context.Employees
            .Include(e => e.Department)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (emp == null)
        {
            throw new NotFoundException($"Không tìm thấy nhân viên với mã số {id}.");
        }

        var emailLower = dto.Email.Trim().ToLower();

        // Verify department exists
        var departmentExists = await _context.Departments.AnyAsync(d => d.Id == dto.DepartmentId);
        if (!departmentExists)
        {
            throw new NotFoundException($"Phòng ban với mã số {dto.DepartmentId} không tồn tại.");
        }

        // Verify email uniqueness
        if (await _context.Employees.AnyAsync(e => e.Id != id && e.Email.ToLower() == emailLower))
        {
            throw new ConflictException($"Email '{dto.Email}' đã được sử dụng bởi một nhân viên khác.");
        }

        emp.FirstName = dto.FirstName.Trim();
        emp.LastName = dto.LastName.Trim();
        emp.Email = emailLower;
        emp.PhoneNumber = dto.PhoneNumber?.Trim();
        emp.DateOfBirth = DateTime.SpecifyKind(dto.DateOfBirth, DateTimeKind.Utc);
        emp.HireDate = DateTime.SpecifyKind(dto.HireDate, DateTimeKind.Utc);
        emp.Position = dto.Position.Trim();
        emp.Salary = dto.Salary;
        emp.Status = dto.Status;
        emp.DepartmentId = dto.DepartmentId;
        emp.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _context.Entry(emp).Reference(e => e.Department).LoadAsync();

        return MapToDto(emp);
    }

    public async Task DeleteAsync(int id)
    {
        var emp = await _context.Employees.FindAsync(id);
        if (emp == null)
        {
            throw new NotFoundException($"Không tìm thấy nhân viên với mã số {id}.");
        }

        _context.Employees.Remove(emp);
        await _context.SaveChangesAsync();
    }

    public async Task<Dictionary<string, int>> GetStatisticsAsync()
    {
        var total = await _context.Employees.CountAsync();
        var active = await _context.Employees.CountAsync(e => e.Status == EmployeeStatus.Active);
        var onLeave = await _context.Employees.CountAsync(e => e.Status == EmployeeStatus.OnLeave);
        var terminated = await _context.Employees.CountAsync(e => e.Status == EmployeeStatus.Terminated);
        var totalDepts = await _context.Departments.CountAsync();

        return new Dictionary<string, int>
        {
            { "totalEmployees", total },
            { "activeEmployees", active },
            { "onLeaveEmployees", onLeave },
            { "terminatedEmployees", terminated },
            { "totalDepartments", totalDepts }
        };
    }

    private static IQueryable<Employee> ApplySorting(IQueryable<Employee> query, string? sortBy, bool sortDescending)
    {
        var sort = sortBy?.ToLower().Trim();

        return sort switch
        {
            "name" => sortDescending 
                ? query.OrderByDescending(e => e.LastName).ThenByDescending(e => e.FirstName)
                : query.OrderBy(e => e.LastName).ThenBy(e => e.FirstName),
            "email" => sortDescending ? query.OrderByDescending(e => e.Email) : query.OrderBy(e => e.Email),
            "salary" => sortDescending ? query.OrderByDescending(e => e.Salary) : query.OrderBy(e => e.Salary),
            "hiredate" => sortDescending ? query.OrderByDescending(e => e.HireDate) : query.OrderBy(e => e.HireDate),
            "dateofbirth" => sortDescending ? query.OrderByDescending(e => e.DateOfBirth) : query.OrderBy(e => e.DateOfBirth),
            "position" => sortDescending ? query.OrderByDescending(e => e.Position) : query.OrderBy(e => e.Position),
            "status" => sortDescending ? query.OrderByDescending(e => e.Status) : query.OrderBy(e => e.Status),
            "department" => sortDescending 
                ? query.OrderByDescending(e => e.Department != null ? e.Department.Name : string.Empty)
                : query.OrderBy(e => e.Department != null ? e.Department.Name : string.Empty),
            _ => sortDescending ? query.OrderByDescending(e => e.Id) : query.OrderBy(e => e.Id)
        };
    }

    private static EmployeeDto MapToDto(Employee e)
    {
        return new EmployeeDto
        {
            Id = e.Id,
            FirstName = e.FirstName,
            LastName = e.LastName,
            Email = e.Email,
            PhoneNumber = e.PhoneNumber,
            DateOfBirth = e.DateOfBirth,
            HireDate = e.HireDate,
            Position = e.Position,
            Salary = e.Salary,
            Status = e.Status,
            DepartmentId = e.DepartmentId,
            DepartmentName = e.Department?.Name ?? string.Empty,
            DepartmentCode = e.Department?.Code ?? string.Empty,
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt
        };
    }
}
