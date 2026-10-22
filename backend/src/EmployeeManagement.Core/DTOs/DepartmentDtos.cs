using System.ComponentModel.DataAnnotations;

namespace EmployeeManagement.Core.DTOs;

public class DepartmentDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
    public int EmployeeCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateDepartmentDto
{
    [Required(ErrorMessage = "Tên phòng ban là bắt buộc")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Tên phòng ban phải từ 2 đến 100 ký tự")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mã phòng ban là bắt buộc")]
    [StringLength(20, MinimumLength = 2, ErrorMessage = "Mã phòng ban phải từ 2 đến 20 ký tự")]
    [RegularExpression(@"^[A-Z0-9_-]+$", ErrorMessage = "Mã phòng ban chỉ được chứa chữ hoa, số, dấu gạch nối hoặc gạch dưới (VD: IT, HR, FIN-01)")]
    public string Code { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "Mô tả không được vượt quá 500 ký tự")]
    public string? Description { get; set; }

    [StringLength(100, ErrorMessage = "Vị trí không được vượt quá 100 ký tự")]
    public string? Location { get; set; }
}

public class UpdateDepartmentDto : CreateDepartmentDto
{
}
