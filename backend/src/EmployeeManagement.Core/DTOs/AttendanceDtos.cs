using System.ComponentModel.DataAnnotations;
using EmployeeManagement.Core.Enums;

namespace EmployeeManagement.Core.DTOs;

public class AttendanceDto
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string EmployeeEmail { get; set; } = string.Empty;
    public string EmployeePosition { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public int DepartmentId { get; set; }
    public DateTime Date { get; set; }
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public decimal? WorkingHours { get; set; }
    public AttendanceStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CheckInRequestDto
{
    public int? EmployeeId { get; set; }
    public string? Notes { get; set; }
}

public class CheckOutRequestDto
{
    public int? EmployeeId { get; set; }
    public string? Notes { get; set; }
}

public class CreateAttendanceDto
{
    [Required(ErrorMessage = "Vui lòng chọn nhân viên.")]
    public int EmployeeId { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn ngày chấm công.")]
    public DateTime Date { get; set; }

    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public decimal? WorkingHours { get; set; }
    public AttendanceStatus Status { get; set; } = AttendanceStatus.Present;

    [MaxLength(500, ErrorMessage = "Ghi chú không được vượt quá 500 ký tự.")]
    public string? Notes { get; set; }
}

public class UpdateAttendanceDto
{
    [Required(ErrorMessage = "Vui lòng chọn ngày chấm công.")]
    public DateTime Date { get; set; }

    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public decimal? WorkingHours { get; set; }
    public AttendanceStatus Status { get; set; }

    [MaxLength(500, ErrorMessage = "Ghi chú không được vượt quá 500 ký tự.")]
    public string? Notes { get; set; }
}

public class AttendancePagedRequest
{
    private const int MaxPageSize = 100;
    private int _pageSize = 10;
    private int _pageNumber = 1;

    public int PageNumber
    {
        get => _pageNumber;
        set => _pageNumber = value < 1 ? 1 : value;
    }

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value > MaxPageSize ? MaxPageSize : (value < 1 ? 10 : value);
    }

    public string? SearchTerm { get; set; }
    public int? DepartmentId { get; set; }
    public int? EmployeeId { get; set; }
    public AttendanceStatus? Status { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? SortBy { get; set; } = "Date";
    public bool SortDescending { get; set; } = true;
}

public class AttendanceStatisticsDto
{
    public int TotalRecords { get; set; }
    public int PresentCount { get; set; }
    public int LateCount { get; set; }
    public int EarlyLeaveCount { get; set; }
    public int AbsentCount { get; set; }
    public int OnLeaveCount { get; set; }
    public decimal TotalWorkingHours { get; set; }
    public decimal AverageHoursPerDay { get; set; }
    public decimal OnTimeRate { get; set; }
}

public class TodayAttendanceStatusDto
{
    public bool HasCheckedIn { get; set; }
    public bool HasCheckedOut { get; set; }
    public int? EmployeeId { get; set; }
    public string? EmployeeName { get; set; }
    public AttendanceDto? Attendance { get; set; }
}
