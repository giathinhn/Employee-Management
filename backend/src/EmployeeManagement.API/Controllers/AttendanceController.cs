using System.Security.Claims;
using EmployeeManagement.Core.DTOs;
using EmployeeManagement.Core.DTOs.Common;
using EmployeeManagement.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _attendanceService;

    public AttendanceController(IAttendanceService attendanceService)
    {
        _attendanceService = attendanceService;
    }

    /// <summary>
    /// Lấy danh sách chấm công có phân trang, tìm kiếm, lọc theo phòng ban, nhân viên, ngày, trạng thái
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResult<AttendanceDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<AttendanceDto>>> GetPaged([FromQuery] AttendancePagedRequest request)
    {
        var result = await _attendanceService.GetPagedAsync(request);
        return Ok(result);
    }

    /// <summary>
    /// Lấy chi tiết bản ghi chấm công theo Id
    /// </summary>
    /// <summary>
    /// Xuất bảng chấm công ra file Excel (.xlsx) theo bộ lọc
    /// </summary>
    [HttpGet("export-excel")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportExcel([FromQuery] AttendancePagedRequest request)
    {
        var fileBytes = await _attendanceService.ExportToExcelAsync(request);
        var fileName = $"Bang_Cham_Cong_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
        return File(
            fileBytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            fileName);
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AttendanceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AttendanceDto>> GetById(int id)
    {
        var result = await _attendanceService.GetByIdAsync(id);
        return Ok(result);
    }

    /// <summary>
    /// Lấy trạng thái chấm công hôm nay của nhân viên hiện tại hoặc theo EmployeeId
    /// </summary>
    [HttpGet("today-status")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(TodayAttendanceStatusDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<TodayAttendanceStatusDto>> GetTodayStatus([FromQuery] int? employeeId)
    {
        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
        var result = await _attendanceService.GetTodayStatusAsync(employeeId, userEmail);
        return Ok(result);
    }

    /// <summary>
    /// Thống kê tình hình chấm công (tổng số, đúng giờ, đi muộn, về sớm, tổng giờ làm, tỷ lệ chuyên cần)
    /// </summary>
    [HttpGet("statistics")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AttendanceStatisticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AttendanceStatisticsDto>> GetStatistics(
        [FromQuery] int? month,
        [FromQuery] int? year,
        [FromQuery] int? departmentId)
    {
        var stats = await _attendanceService.GetStatisticsAsync(month, year, departmentId);
        return Ok(stats);
    }

    /// <summary>
    /// Thực hiện chấm công vào (Check-in) nhanh 1-chạm
    /// </summary>
    [HttpPost("check-in")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AttendanceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AttendanceDto>> CheckIn([FromBody] CheckInRequestDto dto)
    {
        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
        var result = await _attendanceService.CheckInAsync(dto, userEmail);
        return Ok(result);
    }

    /// <summary>
    /// Thực hiện chấm công ra / tan ca (Check-out)
    /// </summary>
    [HttpPost("check-out")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AttendanceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AttendanceDto>> CheckOut([FromBody] CheckOutRequestDto dto)
    {
        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
        var result = await _attendanceService.CheckOutAsync(dto, userEmail);
        return Ok(result);
    }

    /// <summary>
    /// Thêm bản ghi chấm công thủ công (Chấm công bù / Quên quét mã) - Dành cho Quản trị & Quản lý
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(AttendanceDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AttendanceDto>> Create([FromBody] CreateAttendanceDto dto)
    {
        var created = await _attendanceService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>
    /// Điều chỉnh / Sửa bản ghi chấm công
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(AttendanceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AttendanceDto>> Update(int id, [FromBody] UpdateAttendanceDto dto)
    {
        var updated = await _attendanceService.UpdateAsync(id, dto);
        return Ok(updated);
    }

    /// <summary>
    /// Xóa bản ghi chấm công (Chỉ Quản trị viên Admin)
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        await _attendanceService.DeleteAsync(id);
        return NoContent();
    }
}
