using ClosedXML.Excel;
using EmployeeManagement.Core.DTOs;
using EmployeeManagement.Core.Enums;
using EmployeeManagement.Core.Interfaces;

namespace EmployeeManagement.Infrastructure.Services;

public class ExcelExportService : IExcelExportService
{
    private static readonly XLColor PrimaryHeaderColor = XLColor.FromArgb(15, 23, 42); // #0F172A Slate 900
    private static readonly XLColor ZebraBgColor = XLColor.FromArgb(248, 250, 252);     // #F8FAFC Slate 50
    private static readonly XLColor SummaryBgColor = XLColor.FromArgb(241, 245, 249);   // #F1F5F9 Slate 100
    private static readonly XLColor BorderLightColor = XLColor.FromArgb(226, 232, 240); // #E2E8F0 Slate 200

    public byte[] ExportEmployeesToExcel(IEnumerable<EmployeeDto> employees)
    {
        var list = employees.ToList();
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Danh Sách Nhân Viên");

        ws.ShowGridLines = true;

        // 1. Title Banner
        ws.Cell("A1").Value = "HỆ THỐNG QUẢN LÝ NHÂN SỰ - BÁO CÁO DANH SÁCH NHÂN VIÊN";
        ws.Range("A1:K1").Merge();
        ws.Range("A1:K1").Style.Font.Bold = true;
        ws.Range("A1:K1").Style.Font.FontSize = 15;
        ws.Range("A1:K1").Style.Font.FontColor = PrimaryHeaderColor;
        ws.Range("A1:K1").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        ws.Range("A1:K1").Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        ws.Row(1).Height = 32;

        // 2. Subtitle info
        var exportDate = DateTime.Now.ToString("dd/MM/yyyy HH:mm");
        ws.Cell("A2").Value = $"Ngày xuất: {exportDate} | Tổng số nhân sự: {list.Count} người";
        ws.Range("A2:K2").Merge();
        ws.Range("A2:K2").Style.Font.Italic = true;
        ws.Range("A2:K2").Style.Font.FontSize = 9.5;
        ws.Range("A2:K2").Style.Font.FontColor = XLColor.FromArgb(100, 116, 139);
        ws.Range("A2:K2").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        ws.Row(2).Height = 20;

        // 3. Table Headers
        var headers = new[]
        {
            "STT",
            "Mã NV",
            "Họ và tên",
            "Email",
            "Số điện thoại",
            "Ngày sinh",
            "Ngày vào làm",
            "Chức vụ",
            "Phòng ban",
            "Mức lương (VNĐ)",
            "Trạng thái"
        };

        const int startRow = 4;
        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(startRow, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontSize = 10;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Fill.BackgroundColor = PrimaryHeaderColor;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            cell.Style.Border.OutsideBorderColor = BorderLightColor;
        }
        ws.Row(startRow).Height = 26;

        // 4. Data rows
        int currentRow = startRow + 1;
        int stt = 1;

        foreach (var emp in list)
        {
            ws.Cell(currentRow, 1).Value = stt++;
            ws.Cell(currentRow, 2).Value = $"#{emp.Id}";
            ws.Cell(currentRow, 3).Value = emp.FullName;
            ws.Cell(currentRow, 4).Value = emp.Email;
            ws.Cell(currentRow, 5).Value = emp.PhoneNumber ?? "—";
            ws.Cell(currentRow, 6).Value = emp.DateOfBirth.ToString("dd/MM/yyyy");
            ws.Cell(currentRow, 7).Value = emp.HireDate.ToString("dd/MM/yyyy");
            ws.Cell(currentRow, 8).Value = emp.Position;
            ws.Cell(currentRow, 9).Value = emp.DepartmentName;
            ws.Cell(currentRow, 10).Value = emp.Salary;
            ws.Cell(currentRow, 11).Value = emp.StatusName;

            // Formats & alignments
            ws.Cell(currentRow, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws.Cell(currentRow, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws.Cell(currentRow, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
            ws.Cell(currentRow, 4).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
            ws.Cell(currentRow, 5).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws.Cell(currentRow, 6).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws.Cell(currentRow, 7).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws.Cell(currentRow, 8).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
            ws.Cell(currentRow, 9).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
            
            // Currency format
            ws.Cell(currentRow, 10).Style.NumberFormat.Format = "#,##0";
            ws.Cell(currentRow, 10).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
            
            ws.Cell(currentRow, 11).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            // Zebra background
            var rowRange = ws.Range(currentRow, 1, currentRow, 11);
            if (stt % 2 == 1)
            {
                rowRange.Style.Fill.BackgroundColor = ZebraBgColor;
            }
            rowRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            rowRange.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
            rowRange.Style.Border.OutsideBorderColor = BorderLightColor;
            rowRange.Style.Border.InsideBorderColor = BorderLightColor;
            rowRange.Style.Font.FontSize = 9.5;
            ws.Row(currentRow).Height = 22;

            currentRow++;
        }

        // 5. Summary Row
        if (list.Count > 0)
        {
            ws.Cell(currentRow, 1).Value = "TỔNG CỘNG";
            ws.Range(currentRow, 1, currentRow, 9).Merge();
            ws.Range(currentRow, 1, currentRow, 9).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
            ws.Range(currentRow, 1, currentRow, 9).Style.Font.Bold = true;

            var sumFormula = $"=SUM(J{startRow + 1}:J{currentRow - 1})";
            ws.Cell(currentRow, 10).FormulaA1 = sumFormula;
            ws.Cell(currentRow, 10).Style.NumberFormat.Format = "#,##0";
            ws.Cell(currentRow, 10).Style.Font.Bold = true;
            ws.Cell(currentRow, 10).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

            ws.Cell(currentRow, 11).Value = $"{list.Count} nhân sự";
            ws.Cell(currentRow, 11).Style.Font.Bold = true;
            ws.Cell(currentRow, 11).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            var sumRange = ws.Range(currentRow, 1, currentRow, 11);
            sumRange.Style.Fill.BackgroundColor = SummaryBgColor;
            sumRange.Style.Border.TopBorder = XLBorderStyleValues.Thin;
            sumRange.Style.Border.BottomBorder = XLBorderStyleValues.Double;
            sumRange.Style.Border.TopBorderColor = BorderLightColor;
            sumRange.Style.Border.BottomBorderColor = PrimaryHeaderColor;
            ws.Row(currentRow).Height = 25;
        }

        // 6. Adjust column widths
        ws.Columns(1, 11).AdjustToContents(10, 40);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public byte[] ExportAttendanceToExcel(IEnumerable<AttendanceDto> attendances, AttendanceStatisticsDto? statistics = null)
    {
        var list = attendances.ToList();
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Bảng Chấm Công");

        ws.ShowGridLines = true;

        // 1. Title Banner
        ws.Cell("A1").Value = "HỆ THỐNG QUẢN LÝ NHÂN SỰ - BÁO CÁO BẢNG CHẤM CÔNG & ĐIỂM DANH";
        ws.Range("A1:L1").Merge();
        ws.Range("A1:L1").Style.Font.Bold = true;
        ws.Range("A1:L1").Style.Font.FontSize = 15;
        ws.Range("A1:L1").Style.Font.FontColor = PrimaryHeaderColor;
        ws.Range("A1:L1").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        ws.Range("A1:L1").Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        ws.Row(1).Height = 32;

        // 2. Subtitle info
        var exportDate = DateTime.Now.ToString("dd/MM/yyyy HH:mm");
        var statsInfo = statistics != null 
            ? $" | Đúng giờ: {statistics.PresentCount} | Đi muộn: {statistics.LateCount} | Về sớm: {statistics.EarlyLeaveCount} | Tỷ lệ chuyên cần: {statistics.OnTimeRate}%"
            : "";
        ws.Cell("A2").Value = $"Ngày xuất: {exportDate} | Tổng số lượt chấm công: {list.Count}{statsInfo}";
        ws.Range("A2:L2").Merge();
        ws.Range("A2:L2").Style.Font.Italic = true;
        ws.Range("A2:L2").Style.Font.FontSize = 9.5;
        ws.Range("A2:L2").Style.Font.FontColor = XLColor.FromArgb(100, 116, 139);
        ws.Range("A2:L2").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        ws.Row(2).Height = 20;

        // 3. Table Headers
        var headers = new[]
        {
            "STT",
            "Mã NV",
            "Họ và tên",
            "Email",
            "Chức vụ",
            "Phòng ban",
            "Ngày làm việc",
            "Giờ vào",
            "Giờ ra",
            "Số giờ làm (h)",
            "Trạng thái",
            "Ghi chú / Giải trình"
        };

        const int startRow = 4;
        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(startRow, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontSize = 10;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Fill.BackgroundColor = PrimaryHeaderColor;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            cell.Style.Border.OutsideBorderColor = BorderLightColor;
        }
        ws.Row(startRow).Height = 26;

        // 4. Data rows
        int currentRow = startRow + 1;
        int stt = 1;

        foreach (var att in list)
        {
            ws.Cell(currentRow, 1).Value = stt++;
            ws.Cell(currentRow, 2).Value = $"#{att.EmployeeId}";
            ws.Cell(currentRow, 3).Value = att.EmployeeName;
            ws.Cell(currentRow, 4).Value = att.EmployeeEmail;
            ws.Cell(currentRow, 5).Value = att.EmployeePosition;
            ws.Cell(currentRow, 6).Value = att.DepartmentName;
            ws.Cell(currentRow, 7).Value = att.Date.ToString("dd/MM/yyyy");
            ws.Cell(currentRow, 8).Value = att.CheckInTime.HasValue ? att.CheckInTime.Value.ToLocalTime().ToString("HH:mm") : "—";
            ws.Cell(currentRow, 9).Value = att.CheckOutTime.HasValue ? att.CheckOutTime.Value.ToLocalTime().ToString("HH:mm") : "Chưa ra";
            ws.Cell(currentRow, 10).Value = att.WorkingHours ?? 0m;
            ws.Cell(currentRow, 11).Value = att.StatusText;
            ws.Cell(currentRow, 12).Value = att.Notes ?? "—";

            // Alignments & formats
            ws.Cell(currentRow, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws.Cell(currentRow, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws.Cell(currentRow, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
            ws.Cell(currentRow, 4).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
            ws.Cell(currentRow, 5).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
            ws.Cell(currentRow, 6).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
            ws.Cell(currentRow, 7).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws.Cell(currentRow, 8).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws.Cell(currentRow, 9).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            ws.Cell(currentRow, 10).Style.NumberFormat.Format = "0.00";
            ws.Cell(currentRow, 10).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

            ws.Cell(currentRow, 11).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws.Cell(currentRow, 12).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;

            // Zebra background
            var rowRange = ws.Range(currentRow, 1, currentRow, 12);
            if (stt % 2 == 1)
            {
                rowRange.Style.Fill.BackgroundColor = ZebraBgColor;
            }
            rowRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            rowRange.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
            rowRange.Style.Border.OutsideBorderColor = BorderLightColor;
            rowRange.Style.Border.InsideBorderColor = BorderLightColor;
            rowRange.Style.Font.FontSize = 9.5;
            ws.Row(currentRow).Height = 22;

            currentRow++;
        }

        // 5. Summary Row
        if (list.Count > 0)
        {
            ws.Cell(currentRow, 1).Value = "TỔNG SỐ GIỜ CÔNG";
            ws.Range(currentRow, 1, currentRow, 9).Merge();
            ws.Range(currentRow, 1, currentRow, 9).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
            ws.Range(currentRow, 1, currentRow, 9).Style.Font.Bold = true;

            var sumFormula = $"=SUM(J{startRow + 1}:J{currentRow - 1})";
            ws.Cell(currentRow, 10).FormulaA1 = sumFormula;
            ws.Cell(currentRow, 10).Style.NumberFormat.Format = "0.00";
            ws.Cell(currentRow, 10).Style.Font.Bold = true;
            ws.Cell(currentRow, 10).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

            ws.Cell(currentRow, 11).Value = $"{list.Count} lượt";
            ws.Cell(currentRow, 11).Style.Font.Bold = true;
            ws.Cell(currentRow, 11).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            ws.Cell(currentRow, 12).Value = "";

            var sumRange = ws.Range(currentRow, 1, currentRow, 12);
            sumRange.Style.Fill.BackgroundColor = SummaryBgColor;
            sumRange.Style.Border.TopBorder = XLBorderStyleValues.Thin;
            sumRange.Style.Border.BottomBorder = XLBorderStyleValues.Double;
            sumRange.Style.Border.TopBorderColor = BorderLightColor;
            sumRange.Style.Border.BottomBorderColor = PrimaryHeaderColor;
            ws.Row(currentRow).Height = 25;
        }

        // 6. Adjust column widths
        ws.Columns(1, 12).AdjustToContents(10, 40);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}
