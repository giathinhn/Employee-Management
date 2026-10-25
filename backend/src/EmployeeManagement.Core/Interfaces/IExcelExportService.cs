using EmployeeManagement.Core.DTOs;

namespace EmployeeManagement.Core.Interfaces;

public interface IExcelExportService
{
    byte[] ExportEmployeesToExcel(IEnumerable<EmployeeDto> employees);
    byte[] ExportAttendanceToExcel(IEnumerable<AttendanceDto> attendances, AttendanceStatisticsDto? statistics = null);
}
