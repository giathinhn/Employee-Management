using EmployeeManagement.Core.DTOs;
using EmployeeManagement.Core.Entities;
using EmployeeManagement.Core.Exceptions;
using EmployeeManagement.Infrastructure.Data;
using EmployeeManagement.Infrastructure.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace EmployeeManagement.Tests;

public class DepartmentServiceTests
{
    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateAsync_ShouldCreateDepartment_WhenValidDtoProvided()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var service = new DepartmentService(context);

        var dto = new CreateDepartmentDto
        {
            Name = "Phòng Pháp Chế",
            Code = "LEGAL",
            Description = "Tư vấn luật doanh nghiệp",
            Location = "Tầng 7"
        };

        // Act
        var result = await service.CreateAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().BeGreaterThan(0);
        result.Name.Should().Be("Phòng Pháp Chế");
        result.Code.Should().Be("LEGAL");
        result.EmployeeCount.Should().Be(0);

        var inDb = await context.Departments.FindAsync(result.Id);
        inDb.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateAsync_ShouldThrowConflictException_WhenCodeAlreadyExists()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        context.Departments.Add(new Department { Name = "Phòng IT", Code = "IT" });
        await context.SaveChangesAsync();

        var service = new DepartmentService(context);
        var dto = new CreateDepartmentDto
        {
            Name = "Phòng IT Mới",
            Code = "it", // case-insensitive duplicate
        };

        // Act
        var act = () => service.CreateAsync(dto);

        // Assert
        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*đã tồn tại*");
    }

    [Fact]
    public async Task GetAllAsync_ShouldFilterBySearchTerm()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        context.Departments.AddRange(
            new Department { Name = "Phòng Kỹ Thuật", Code = "TECH" },
            new Department { Name = "Phòng Nhân Sự", Code = "HR" },
            new Department { Name = "Phòng Kế Toán", Code = "ACC" }
        );
        await context.SaveChangesAsync();

        var service = new DepartmentService(context);

        // Act
        var result = await service.GetAllAsync("kỹ thuật");

        // Assert
        result.Should().HaveCount(1);
        result.First().Code.Should().Be("TECH");
    }

    [Fact]
    public async Task DeleteAsync_ShouldThrowConflictException_WhenDepartmentHasEmployees()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var dept = new Department { Name = "Phòng IT", Code = "IT" };
        context.Departments.Add(dept);
        await context.SaveChangesAsync();

        var emp = new Employee
        {
            FirstName = "Văn",
            LastName = "A",
            Email = "a@test.com",
            Position = "Dev",
            DepartmentId = dept.Id
        };
        context.Employees.Add(emp);
        await context.SaveChangesAsync();

        var service = new DepartmentService(context);

        // Act
        var act = () => service.DeleteAsync(dept.Id);

        // Assert
        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*vì đang có 1 nhân viên*");
    }

    [Fact]
    public async Task DeleteAsync_ShouldSucceed_WhenDepartmentHasNoEmployees()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var dept = new Department { Name = "Phòng Trống", Code = "EMPTY" };
        context.Departments.Add(dept);
        await context.SaveChangesAsync();

        var service = new DepartmentService(context);

        // Act
        await service.DeleteAsync(dept.Id);

        // Assert
        var inDb = await context.Departments.FindAsync(dept.Id);
        inDb.Should().BeNull();
    }
}
