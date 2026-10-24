using EmployeeManagement.Core.DTOs;
using EmployeeManagement.Core.Entities;
using EmployeeManagement.Core.Enums;
using EmployeeManagement.Core.Exceptions;
using EmployeeManagement.Infrastructure.Data;
using EmployeeManagement.Infrastructure.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace EmployeeManagement.Tests;

public class AttendanceServiceTests
{
    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static async Task<Employee> SeedEmployeeAsync(AppDbContext context, string email = "test.emp@company.com")
    {
        var dept = new Department { Name = "Phòng Công Nghệ", Code = "IT" };
        context.Departments.Add(dept);
        await context.SaveChangesAsync();

        var emp = new Employee
        {
            FirstName = "Hoàng",
            LastName = "Nam",
            Email = email,
            DepartmentId = dept.Id,
            Position = "Software Engineer",
            Salary = 30000000m,
            Status = EmployeeStatus.Active,
            DateOfBirth = DateTime.UtcNow.AddYears(-25),
            HireDate = DateTime.UtcNow.AddYears(-2)
        };
        context.Employees.Add(emp);
        await context.SaveChangesAsync();

        return emp;
    }

    [Fact]
    public async Task CheckInAsync_ShouldRecordCheckIn_WhenFirstTimeToday()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var emp = await SeedEmployeeAsync(context);
        var service = new AttendanceService(context);

        var dto = new CheckInRequestDto
        {
            EmployeeId = emp.Id,
            Notes = "Chấm công đúng giờ"
        };

        // Act
        var result = await service.CheckInAsync(dto, null);

        // Assert
        result.Should().NotBeNull();
        result.EmployeeId.Should().Be(emp.Id);
        result.CheckInTime.Should().NotBeNull();
        result.Notes.Should().Contain("Chấm công đúng giờ");

        var inDb = await context.Attendances.FirstOrDefaultAsync(a => a.EmployeeId == emp.Id);
        inDb.Should().NotBeNull();
        inDb!.CheckInTime.Should().NotBeNull();
    }

    [Fact]
    public async Task CheckInAsync_ShouldThrowConflictException_WhenAlreadyCheckedInToday()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var emp = await SeedEmployeeAsync(context);
        var service = new AttendanceService(context);

        var dto = new CheckInRequestDto { EmployeeId = emp.Id };
        await service.CheckInAsync(dto, null);

        // Act & Assert
        var act = async () => await service.CheckInAsync(dto, null);
        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task CheckOutAsync_ShouldCalculateWorkingHours_WhenCheckedIn()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var emp = await SeedEmployeeAsync(context);
        var service = new AttendanceService(context);

        // First check in
        await service.CheckInAsync(new CheckInRequestDto { EmployeeId = emp.Id }, null);

        // Act
        var result = await service.CheckOutAsync(new CheckOutRequestDto { EmployeeId = emp.Id, Notes = "Tan ca" }, null);

        // Assert
        result.Should().NotBeNull();
        result.CheckOutTime.Should().NotBeNull();
        result.WorkingHours.Should().BeGreaterThanOrEqualTo(0.1m);
    }

    [Fact]
    public async Task CheckOutAsync_ShouldThrowValidationException_WhenNotCheckedIn()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var emp = await SeedEmployeeAsync(context);
        var service = new AttendanceService(context);

        // Act & Assert
        var act = async () => await service.CheckOutAsync(new CheckOutRequestDto { EmployeeId = emp.Id }, null);
        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task CreateAsync_ShouldCreateAttendance_WhenValidDtoProvided()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var emp = await SeedEmployeeAsync(context);
        var service = new AttendanceService(context);

        var pastDate = DateTime.UtcNow.AddDays(-2).Date;
        var dto = new CreateAttendanceDto
        {
            EmployeeId = emp.Id,
            Date = pastDate,
            CheckInTime = pastDate.AddHours(8).AddMinutes(30),
            CheckOutTime = pastDate.AddHours(17).AddMinutes(30),
            WorkingHours = 9.0m,
            Status = AttendanceStatus.Present,
            Notes = "Chấm công bổ sung"
        };

        // Act
        var result = await service.CreateAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result.EmployeeId.Should().Be(emp.Id);
        result.WorkingHours.Should().Be(9.0m);
        result.Status.Should().Be(AttendanceStatus.Present);
    }

    [Fact]
    public async Task CreateAsync_ShouldThrowConflictException_WhenRecordForDateAlreadyExists()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var emp = await SeedEmployeeAsync(context);
        var service = new AttendanceService(context);

        var date = DateTime.UtcNow.AddDays(-1).Date;
        var dto = new CreateAttendanceDto
        {
            EmployeeId = emp.Id,
            Date = date,
            Status = AttendanceStatus.Present
        };

        await service.CreateAsync(dto);

        // Act & Assert
        var act = async () => await service.CreateAsync(dto);
        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task GetPagedAsync_ShouldFilterByDepartment()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var emp = await SeedEmployeeAsync(context);
        var service = new AttendanceService(context);

        var date = DateTime.UtcNow.AddDays(-1).Date;
        await service.CreateAsync(new CreateAttendanceDto
        {
            EmployeeId = emp.Id,
            Date = date,
            Status = AttendanceStatus.Present
        });

        // Act
        var request = new AttendancePagedRequest
        {
            DepartmentId = emp.DepartmentId,
            PageNumber = 1,
            PageSize = 10
        };
        var result = await service.GetPagedAsync(request);

        // Assert
        result.TotalCount.Should().Be(1);
        result.Items.Should().HaveCount(1);
        result.Items.First().EmployeeId.Should().Be(emp.Id);
    }

    [Fact]
    public async Task GetStatisticsAsync_ShouldComputeAccurateRates()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var emp = await SeedEmployeeAsync(context);
        var service = new AttendanceService(context);

        var today = DateTime.UtcNow.Date;
        await service.CreateAsync(new CreateAttendanceDto
        {
            EmployeeId = emp.Id,
            Date = today.AddDays(-2),
            Status = AttendanceStatus.Present,
            WorkingHours = 8.0m
        });
        await service.CreateAsync(new CreateAttendanceDto
        {
            EmployeeId = emp.Id,
            Date = today.AddDays(-1),
            Status = AttendanceStatus.Late,
            WorkingHours = 7.5m
        });

        // Act
        var stats = await service.GetStatisticsAsync(today.Month, today.Year, null);

        // Assert
        stats.TotalRecords.Should().Be(2);
        stats.PresentCount.Should().Be(1);
        stats.LateCount.Should().Be(1);
        stats.TotalWorkingHours.Should().Be(15.5m);
        stats.OnTimeRate.Should().Be(50.0m);
    }

    [Fact]
    public async Task DeleteAsync_ShouldRemoveRecord()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var emp = await SeedEmployeeAsync(context);
        var service = new AttendanceService(context);

        var created = await service.CreateAsync(new CreateAttendanceDto
        {
            EmployeeId = emp.Id,
            Date = DateTime.UtcNow.AddDays(-3).Date,
            Status = AttendanceStatus.Present
        });

        // Act
        await service.DeleteAsync(created.Id);

        // Assert
        var inDb = await context.Attendances.FindAsync(created.Id);
        inDb.Should().BeNull();
    }
}
