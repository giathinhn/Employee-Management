using EmployeeManagement.Core.DTOs;
using EmployeeManagement.Core.Enums;
using EmployeeManagement.Infrastructure.Services;
using FluentAssertions;
using Xunit;

namespace EmployeeManagement.Tests;

public class ExcelExportServiceTests
{
    private readonly ExcelExportService _service = new();

    [Fact]
    public void ExportEmployeesToExcel_ShouldReturnNonEmptyByteArray_WhenEmployeesProvided()
    {
        // Arrange
        var employees = new List<EmployeeDto>
        {
            new()
            {
                Id = 1,
                FirstName = "Nguyễn Văn",
                LastName = "An",
                Email = "an.nguyen@company.com",
                PhoneNumber = "0912345678",
                Position = "Senior Developer",
                DepartmentName = "Công nghệ thông tin",
                Salary = 35000000m,
                Status = EmployeeStatus.Active,
                DateOfBirth = new DateTime(1995, 5, 20),
                HireDate = new DateTime(2021, 3, 15)
            },
            new()
            {
                Id = 2,
                FirstName = "Trần Thị",
                LastName = "Bình",
                Email = "binh.tran@company.com",
                PhoneNumber = "0987654321",
                Position = "HR Manager",
                DepartmentName = "Nhân sự",
                Salary = 28000000m,
                Status = EmployeeStatus.Active,
                DateOfBirth = new DateTime(1993, 8, 12),
                HireDate = new DateTime(2020, 6, 1)
            }
        };

        // Act
        var result = _service.ExportEmployeesToExcel(employees);

        // Assert
        result.Should().NotBeNull();
        result.Length.Should().BeGreaterThan(100);
        // Valid ZIP/XLSX starts with PK signature: 0x50, 0x4B
        result[0].Should().Be(0x50);
        result[1].Should().Be(0x4B);
    }

    [Fact]
    public void ExportEmployeesToExcel_ShouldWork_WhenEmptyListProvided()
    {
        // Act
        var result = _service.ExportEmployeesToExcel(new List<EmployeeDto>());

        // Assert
        result.Should().NotBeNull();
        result.Length.Should().BeGreaterThan(100);
        result[0].Should().Be(0x50);
        result[1].Should().Be(0x4B);
    }

    [Fact]
    public void ExportAttendanceToExcel_ShouldReturnNonEmptyByteArray_WhenAttendanceProvided()
    {
        // Arrange
        var attendances = new List<AttendanceDto>
        {
            new()
            {
                Id = 1,
                EmployeeId = 101,
                EmployeeName = "Nguyễn Văn An",
                EmployeeEmail = "an.nguyen@company.com",
                EmployeePosition = "Tech Lead",
                DepartmentName = "IT",
                Date = DateTime.UtcNow.Date,
                CheckInTime = DateTime.UtcNow.Date.AddHours(8).AddMinutes(15),
                CheckOutTime = DateTime.UtcNow.Date.AddHours(17).AddMinutes(30),
                WorkingHours = 8.25m,
                Status = AttendanceStatus.Present,
                StatusText = "Đúng giờ",
                Notes = "Hoàn thành ca làm việc"
            }
        };

        var stats = new AttendanceStatisticsDto
        {
            TotalRecords = 1,
            PresentCount = 1,
            LateCount = 0,
            OnTimeRate = 100m,
            TotalWorkingHours = 8.25m
        };

        // Act
        var result = _service.ExportAttendanceToExcel(attendances, stats);

        // Assert
        result.Should().NotBeNull();
        result.Length.Should().BeGreaterThan(100);
        result[0].Should().Be(0x50);
        result[1].Should().Be(0x4B);
    }
}
