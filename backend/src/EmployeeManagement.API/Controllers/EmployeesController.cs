using EmployeeManagement.Core.DTOs;
using EmployeeManagement.Core.DTOs.Common;
using EmployeeManagement.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _employeeService;

    public EmployeesController(IEmployeeService employeeService)
    {
        _employeeService = employeeService;
    }

    /// <summary>
    /// Lấy danh sách nhân viên có phân trang, tìm kiếm, lọc theo phòng ban/trạng thái/mức lương và sắp xếp
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResult<EmployeeDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<EmployeeDto>>> GetPaged([FromQuery] PagedRequest request)
    {
        var result = await _employeeService.GetPagedAsync(request);
        return Ok(result);
    }

    /// <summary>
    /// Thống kê tổng quan nhân viên (tổng số, hoạt động, nghỉ phép, thôi việc, số phòng ban)
    /// </summary>
    /// <summary>
    /// Xuất danh sách nhân viên ra file Excel (.xlsx) theo bộ lọc
    /// </summary>
    [HttpGet("export-excel")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportExcel([FromQuery] PagedRequest request)
    {
        var fileBytes = await _employeeService.ExportToExcelAsync(request);
        var fileName = $"Danh_Sach_Nhan_Vien_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
        return File(
            fileBytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            fileName);
    }

    [HttpGet("statistics")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(Dictionary<string, int>), StatusCodes.Status200OK)]
    public async Task<ActionResult<Dictionary<string, int>>> GetStatistics()
    {
        var stats = await _employeeService.GetStatisticsAsync();
        return Ok(stats);
    }

    /// <summary>
    /// Lấy chi tiết một nhân viên theo Id
    /// </summary>
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EmployeeDto>> GetById(int id)
    {
        var employee = await _employeeService.GetByIdAsync(id);
        return Ok(employee);
    }

    /// <summary>
    /// Thêm mới nhân viên
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<EmployeeDto>> Create([FromBody] CreateEmployeeDto dto)
    {
        var created = await _employeeService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>
    /// Cập nhật thông tin nhân viên
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<EmployeeDto>> Update(int id, [FromBody] UpdateEmployeeDto dto)
    {
        var updated = await _employeeService.UpdateAsync(id, dto);
        return Ok(updated);
    }

    /// <summary>
    /// Xóa một nhân viên (Chỉ Admin)
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        await _employeeService.DeleteAsync(id);
        return NoContent();
    }
}
