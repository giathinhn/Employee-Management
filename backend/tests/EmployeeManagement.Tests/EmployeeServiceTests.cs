using EmployeeManagement.Core.DTOs;
using EmployeeManagement.Core.DTOs.Common;
using EmployeeManagement.Core.Entities;
using EmployeeManagement.Core.Enums;
using EmployeeManagement.Core.Exceptions;
using EmployeeManagement.Infrastructure.Data;
using EmployeeManagement.Infrastructure.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace EmployeeManagement.Tests;

public class EmployeeServiceTests
{
    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateAsync_ShouldCreateEmployee_WhenDataIsValid()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var dept = new Department { Name = "Phòng IT", Code = "IT" };
        context.Departments.Add(dept);
        await context.SaveChangesAsync();

        var service = new EmployeeService(context);
        var dto = new CreateEmployeeDto
        {
            FirstName = "Trần",
            LastName = "Tuấn",
            Email = "tuan.tran@test.com",
            PhoneNumber = "0912345678",
            DateOfBirth = new DateTime(1995, 1, 1),
            HireDate = new DateTime(2022, 1, 1),
            Position = "Backend Developer",
            Salary = 25000000m,
            Status = EmployeeStatus.Active,
            DepartmentId = dept.Id
        };

        // Act
        var result = await service.CreateAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().BeGreaterThan(0);
        result.FullName.Should().Be("Trần Tuấn");
        result.Email.Should().Be("tuan.tran@test.com");
        result.DepartmentName.Should().Be("Phòng IT");
    }

    [Fact]
    public async Task CreateAsync_ShouldThrowConflictException_WhenEmailAlreadyExists()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var dept = new Department { Name = "Phòng IT", Code = "IT" };
        context.Departments.Add(dept);
        context.Employees.Add(new Employee
        {
            FirstName = "A",
            LastName = "B",
            Email = "duplicate@test.com",
            Position = "Dev",
            DepartmentId = dept.Id
        });
        await context.SaveChangesAsync();

        var service = new EmployeeService(context);
        var dto = new CreateEmployeeDto
        {
            FirstName = "C",
            LastName = "D",
            Email = "DUPLICATE@test.com",
            DepartmentId = dept.Id,
            Position = "Tester",
            Salary = 15000000m
        };

        // Act
        var act = () => service.CreateAsync(dto);

        // Assert
        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*đã được sử dụng*");
    }

    [Fact]
    public async Task CreateAsync_ShouldThrowNotFoundException_WhenDepartmentDoesNotExist()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var service = new EmployeeService(context);
        var dto = new CreateEmployeeDto
        {
            FirstName = "C",
            LastName = "D",
            Email = "unique@test.com",
            DepartmentId = 9999, // non-existent
            Position = "Tester",
            Salary = 15000000m
        };

        // Act
        var act = () => service.CreateAsync(dto);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("*không tồn tại*");
    }

    [Fact]
    public async Task GetPagedAsync_ShouldPaginateAndFilterCorrectly()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var itDept = new Department { Name = "Phòng IT", Code = "IT" };
        var hrDept = new Department { Name = "Phòng HR", Code = "HR" };
        context.Departments.AddRange(itDept, hrDept);
        await context.SaveChangesAsync();

        for (int i = 1; i <= 15; i++)
        {
            context.Employees.Add(new Employee
            {
                FirstName = $"Nhân viên {i}",
                LastName = "IT",
                Email = $"emp{i}@company.com",
                Position = "Developer",
                Salary = 15000000m + (i * 1000000m),
                Status = (i % 3 == 0) ? EmployeeStatus.OnLeave : EmployeeStatus.Active,
                DepartmentId = (i % 2 == 0) ? itDept.Id : hrDept.Id
            });
        }
        await context.SaveChangesAsync();

        var service = new EmployeeService(context);

        // Act - Request Page 2 with PageSize 5 for IT department
        var request = new PagedRequest
        {
            PageNumber = 2,
            PageSize = 5,
            DepartmentId = itDept.Id
        };
        var result = await service.GetPagedAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.TotalCount.Should().Be(7); // 7 even numbers between 1 and 15
        result.Items.Should().HaveCount(2); // 7 - 5 = 2 items on page 2
        result.PageNumber.Should().Be(2);
        result.TotalPages.Should().Be(2);
        result.HasPreviousPage.Should().BeTrue();
        result.HasNextPage.Should().BeFalse();
    }

    [Fact]
    public async Task GetStatisticsAsync_ShouldReturnAccurateCounts()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var dept = new Department { Name = "Phòng IT", Code = "IT" };
        context.Departments.Add(dept);
        await context.SaveChangesAsync();

        context.Employees.AddRange(
            new Employee { FirstName = "1", LastName = "A", Email = "1@a.com", Position = "Dev", Status = EmployeeStatus.Active, DepartmentId = dept.Id },
            new Employee { FirstName = "2", LastName = "B", Email = "2@b.com", Position = "Dev", Status = EmployeeStatus.Active, DepartmentId = dept.Id },
            new Employee { FirstName = "3", LastName = "C", Email = "3@c.com", Position = "Dev", Status = EmployeeStatus.OnLeave, DepartmentId = dept.Id },
            new Employee { FirstName = "4", LastName = "D", Email = "4@d.com", Position = "Dev", Status = EmployeeStatus.Terminated, DepartmentId = dept.Id }
        );
        await context.SaveChangesAsync();

        var service = new EmployeeService(context);

        // Act
        var stats = await service.GetStatisticsAsync();

        // Assert
        stats["totalEmployees"].Should().Be(4);
        stats["activeEmployees"].Should().Be(2);
        stats["onLeaveEmployees"].Should().Be(1);
        stats["terminatedEmployees"].Should().Be(1);
        stats["totalDepartments"].Should().Be(1);
    }
}
