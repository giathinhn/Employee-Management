using EmployeeManagement.Core.DTOs;
using EmployeeManagement.Core.DTOs.Common;

namespace EmployeeManagement.Core.Interfaces;

public interface IEmployeeService
{
    Task<PagedResult<EmployeeDto>> GetPagedAsync(PagedRequest request);
    Task<EmployeeDto> GetByIdAsync(int id);
    Task<EmployeeDto> CreateAsync(CreateEmployeeDto dto);
    Task<EmployeeDto> UpdateAsync(int id, UpdateEmployeeDto dto);
    Task DeleteAsync(int id);
    Task<Dictionary<string, int>> GetStatisticsAsync();
}
