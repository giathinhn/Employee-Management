using EmployeeManagement.Infrastructure.Security;
using FluentAssertions;
using Xunit;

namespace EmployeeManagement.Tests;

public class PasswordHasherTests
{
    [Fact]
    public void HashPassword_ShouldGenerateNonEmptyHashedString()
    {
        // Act
        var hash = PasswordHasher.HashPassword("Test@123456");

        // Assert
        hash.Should().NotBeNullOrWhiteSpace();
        hash.Length.Should().BeGreaterThan(20);
    }

    [Fact]
    public void HashPassword_ShouldGenerateDifferentHashesForSamePassword_DueToUniqueSalt()
    {
        // Act
        var hash1 = PasswordHasher.HashPassword("Test@123456");
        var hash2 = PasswordHasher.HashPassword("Test@123456");

        // Assert
        hash1.Should().NotBe(hash2);
    }

    [Fact]
    public void VerifyPassword_ShouldReturnTrue_WhenPasswordMatches()
    {
        // Arrange
        var password = "SecurePassword@2026";
        var hash = PasswordHasher.HashPassword(password);

        // Act
        var result = PasswordHasher.VerifyPassword(password, hash);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void VerifyPassword_ShouldReturnFalse_WhenPasswordDoesNotMatch()
    {
        // Arrange
        var hash = PasswordHasher.HashPassword("OriginalPassword");

        // Act
        var result = PasswordHasher.VerifyPassword("WrongPassword", hash);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void VerifyPassword_ShouldReturnFalse_WhenHashIsMalformed()
    {
        // Act
        var result = PasswordHasher.VerifyPassword("password", "invalid-base-64-hash");

        // Assert
        result.Should().BeFalse();
    }
}
