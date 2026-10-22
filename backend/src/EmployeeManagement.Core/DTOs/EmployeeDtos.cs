using System.ComponentModel.DataAnnotations;
using EmployeeManagement.Core.Enums;
using EmployeeManagement.Core.Validators;

namespace EmployeeManagement.Core.DTOs;

public class EmployeeDto
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}".Trim();
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public DateTime DateOfBirth { get; set; }
    public DateTime HireDate { get; set; }
    public string Position { get; set; } = string.Empty;
    public decimal Salary { get; set; }
    public EmployeeStatus Status { get; set; }
    public string StatusName => Status.ToString();

    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string DepartmentCode { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateEmployeeDto
{
    [Required(ErrorMessage = "Họ đệm là bắt buộc")]
    [StringLength(50, MinimumLength = 1, ErrorMessage = "Họ đệm từ 1 đến 50 ký tự")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Tên là bắt buộc")]
    [StringLength(50, MinimumLength = 1, ErrorMessage = "Tên từ 1 đến 50 ký tự")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email là bắt buộc")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ")]
    [StringLength(100, ErrorMessage = "Email tối đa 100 ký tự")]
    public string Email { get; set; } = string.Empty;

    [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
    [RegularExpression(@"^(\+84|0)[3|5|7|8|9][0-9]{8}$", ErrorMessage = "Số điện thoại không đúng định dạng Việt Nam (VD: 0912345678 hoặc +84912345678)")]
    public string? PhoneNumber { get; set; }

    [Required(ErrorMessage = "Ngày sinh là bắt buộc")]
    [MinimumAge(18, ErrorMessage = "Nhân viên phải đủ từ 18 tuổi trở lên")]
    public DateTime DateOfBirth { get; set; }

    [Required(ErrorMessage = "Ngày vào làm là bắt buộc")]
    public DateTime HireDate { get; set; }

    [Required(ErrorMessage = "Chức vụ là bắt buộc")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Chức vụ từ 2 đến 100 ký tự")]
    public string Position { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mức lương là bắt buộc")]
    [Range(1000000, 1000000000, ErrorMessage = "Mức lương phải từ 1.000.000 đến 1.000.000.000 VNĐ")]
    public decimal Salary { get; set; }

    [Required(ErrorMessage = "Trạng thái nhân viên là bắt buộc")]
    public EmployeeStatus Status { get; set; } = EmployeeStatus.Active;

    [Required(ErrorMessage = "Phòng ban là bắt buộc")]
    [Range(1, int.MaxValue, ErrorMessage = "Phòng ban không hợp lệ")]
    public int DepartmentId { get; set; }
}

public class UpdateEmployeeDto : CreateEmployeeDto
{
}
