using EmployeeManagement.Core.DTOs;
using EmployeeManagement.Core.Entities;
using EmployeeManagement.Core.Exceptions;
using EmployeeManagement.Core.Interfaces;
using EmployeeManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Infrastructure.Services;

public class DepartmentService : IDepartmentService
{
    private readonly AppDbContext _context;

    public DepartmentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<DepartmentDto>> GetAllAsync(string? searchTerm = null)
    {
        var query = _context.Departments
            .Include(d => d.Employees)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.Trim().ToLower();
            query = query.Where(d => 
                d.Name.ToLower().Contains(term) || 
                d.Code.ToLower().Contains(term) ||
                (d.Location != null && d.Location.ToLower().Contains(term)));
        }

        var departments = await query
            .OrderBy(d => d.Name)
            .Select(d => new DepartmentDto
            {
                Id = d.Id,
                Name = d.Name,
                Code = d.Code,
                Description = d.Description,
                Location = d.Location,
                EmployeeCount = d.Employees.Count,
                CreatedAt = d.CreatedAt,
                UpdatedAt = d.UpdatedAt
            })
            .ToListAsync();

        return departments;
    }

    public async Task<DepartmentDto> GetByIdAsync(int id)
    {
        var dept = await _context.Departments
            .Include(d => d.Employees)
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id);

        if (dept == null)
        {
            throw new NotFoundException($"Không tìm thấy phòng ban với mã số {id}.");
        }

        return new DepartmentDto
        {
            Id = dept.Id,
            Name = dept.Name,
            Code = dept.Code,
            Description = dept.Description,
            Location = dept.Location,
            EmployeeCount = dept.Employees.Count,
            CreatedAt = dept.CreatedAt,
            UpdatedAt = dept.UpdatedAt
        };
    }

    public async Task<DepartmentDto> CreateAsync(CreateDepartmentDto dto)
    {
        var codeUpper = dto.Code.Trim().ToUpper();
        var nameTrimmed = dto.Name.Trim();

        // Check unique code
        if (await _context.Departments.AnyAsync(d => d.Code.ToUpper() == codeUpper))
        {
            throw new ConflictException($"Mã phòng ban '{codeUpper}' đã tồn tại.");
        }

        // Check unique name
        if (await _context.Departments.AnyAsync(d => d.Name.ToLower() == nameTrimmed.ToLower()))
        {
            throw new ConflictException($"Tên phòng ban '{nameTrimmed}' đã tồn tại.");
        }

        var department = new Department
        {
            Name = nameTrimmed,
            Code = codeUpper,
            Description = dto.Description?.Trim(),
            Location = dto.Location?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Departments.Add(department);
        await _context.SaveChangesAsync();

        return new DepartmentDto
        {
            Id = department.Id,
            Name = department.Name,
            Code = department.Code,
            Description = department.Description,
            Location = department.Location,
            EmployeeCount = 0,
            CreatedAt = department.CreatedAt,
            UpdatedAt = department.UpdatedAt
        };
    }

    public async Task<DepartmentDto> UpdateAsync(int id, UpdateDepartmentDto dto)
    {
        var dept = await _context.Departments
            .Include(d => d.Employees)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (dept == null)
        {
            throw new NotFoundException($"Không tìm thấy phòng ban với mã số {id}.");
        }

        var codeUpper = dto.Code.Trim().ToUpper();
        var nameTrimmed = dto.Name.Trim();

        // Check unique code excluding this id
        if (await _context.Departments.AnyAsync(d => d.Id != id && d.Code.ToUpper() == codeUpper))
        {
            throw new ConflictException($"Mã phòng ban '{codeUpper}' đã được sử dụng bởi phòng ban khác.");
        }

        // Check unique name excluding this id
        if (await _context.Departments.AnyAsync(d => d.Id != id && d.Name.ToLower() == nameTrimmed.ToLower()))
        {
            throw new ConflictException($"Tên phòng ban '{nameTrimmed}' đã được sử dụng bởi phòng ban khác.");
        }

        dept.Name = nameTrimmed;
        dept.Code = codeUpper;
        dept.Description = dto.Description?.Trim();
        dept.Location = dto.Location?.Trim();
        dept.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new DepartmentDto
        {
            Id = dept.Id,
            Name = dept.Name,
            Code = dept.Code,
            Description = dept.Description,
            Location = dept.Location,
            EmployeeCount = dept.Employees.Count,
            CreatedAt = dept.CreatedAt,
            UpdatedAt = dept.UpdatedAt
        };
    }

    public async Task DeleteAsync(int id)
    {
        var dept = await _context.Departments
            .Include(d => d.Employees)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (dept == null)
        {
            throw new NotFoundException($"Không tìm thấy phòng ban với mã số {id}.");
        }

        if (dept.Employees.Any())
        {
            throw new ConflictException($"Không thể xóa phòng ban '{dept.Name}' vì đang có {dept.Employees.Count} nhân viên thuộc phòng ban này. Hãy chuyển nhân viên sang phòng ban khác trước.");
        }

        _context.Departments.Remove(dept);
        await _context.SaveChangesAsync();
    }
}
