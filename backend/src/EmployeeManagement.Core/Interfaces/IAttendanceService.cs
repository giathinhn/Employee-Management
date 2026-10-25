using EmployeeManagement.Core.DTOs;
using EmployeeManagement.Core.DTOs.Common;

namespace EmployeeManagement.Core.Interfaces;

public interface IAttendanceService
{
    Task<PagedResult<AttendanceDto>> GetPagedAsync(AttendancePagedRequest request);
    Task<AttendanceDto> GetByIdAsync(int id);
    Task<TodayAttendanceStatusDto> GetTodayStatusAsync(int? employeeId, string? userEmail);
    Task<AttendanceDto> CheckInAsync(CheckInRequestDto dto, string? userEmail);
    Task<AttendanceDto> CheckOutAsync(CheckOutRequestDto dto, string? userEmail);
    Task<AttendanceDto> CreateAsync(CreateAttendanceDto dto);
    Task<AttendanceDto> UpdateAsync(int id, UpdateAttendanceDto dto);
    Task DeleteAsync(int id);
    Task<AttendanceStatisticsDto> GetStatisticsAsync(int? month, int? year, int? departmentId);
    Task<byte[]> ExportToExcelAsync(AttendancePagedRequest request);
}
