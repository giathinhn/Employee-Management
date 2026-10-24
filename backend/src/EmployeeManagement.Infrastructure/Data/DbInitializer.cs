using EmployeeManagement.Core.Entities;
using EmployeeManagement.Core.Enums;
using EmployeeManagement.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext context)
    {
        // Auto apply pending migrations if applicable
        if (context.Database.IsRelational())
        {
            await context.Database.MigrateAsync();
        }
        else
        {
            await context.Database.EnsureCreatedAsync();
        }

        // Seed Users
        if (!await context.Users.AnyAsync())
        {
            var users = new List<User>
            {
                new()
                {
                    Username = "admin",
                    Email = "admin@company.com",
                    PasswordHash = PasswordHasher.HashPassword("Admin@123"),
                    Role = "Admin",
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Username = "manager",
                    Email = "manager@company.com",
                    PasswordHash = PasswordHasher.HashPassword("Manager@123"),
                    Role = "Manager",
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Username = "employee",
                    Email = "employee@company.com",
                    PasswordHash = PasswordHasher.HashPassword("Employee@123"),
                    Role = "Employee",
                    CreatedAt = DateTime.UtcNow
                }
            };
            await context.Users.AddRangeAsync(users);
            await context.SaveChangesAsync();
        }

        // Seed Departments
        if (!await context.Departments.AnyAsync())
        {
            var depts = new List<Department>
            {
                new()
                {
                    Name = "Phòng Công Nghệ Thông Tin",
                    Code = "IT",
                    Description = "Phát triển phần mềm, quản trị hạ tầng mạng và bảo mật dữ liệu doanh nghiệp",
                    Location = "Tầng 5, Tòa nhà Innovation",
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Name = "Phòng Nhân Sự",
                    Code = "HR",
                    Description = "Quản lý tuyển dụng, chế độ đãi ngộ, văn hóa doanh nghiệp và đào tạo",
                    Location = "Tầng 3, Tòa nhà Innovation",
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Name = "Phòng Tài Chính Kế Toán",
                    Code = "FIN",
                    Description = "Quản lý tài chính, kiểm toán, lập ngân sách và thanh toán lương",
                    Location = "Tầng 4, Tòa nhà Innovation",
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Name = "Phòng Marketing & Truyền Thông",
                    Code = "MKT",
                    Description = "Phát triển thương hiệu, chiến dịch quảng cáo và tiếp thị kỹ thuật số",
                    Location = "Tầng 2, Tòa nhà Innovation",
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Name = "Phòng Nghiên Cứu & Phát Triển",
                    Code = "RND",
                    Description = "Nghiên cứu ứng dụng công nghệ mới và phát triển sản phẩm đột phá",
                    Location = "Tầng 6, Tòa nhà Innovation",
                    CreatedAt = DateTime.UtcNow
                }
            };

            await context.Departments.AddRangeAsync(depts);
            await context.SaveChangesAsync();
        }

        // Seed Employees
        if (!await context.Employees.AnyAsync())
        {
            var itDept = await context.Departments.FirstAsync(d => d.Code == "IT");
            var hrDept = await context.Departments.FirstAsync(d => d.Code == "HR");
            var finDept = await context.Departments.FirstAsync(d => d.Code == "FIN");
            var mktDept = await context.Departments.FirstAsync(d => d.Code == "MKT");
            var rndDept = await context.Departments.FirstAsync(d => d.Code == "RND");

            var employees = new List<Employee>
            {
                new()
                {
                    FirstName = "Nguyễn Văn",
                    LastName = "An",
                    Email = "an.nguyen@company.com",
                    PhoneNumber = "0912345671",
                    DateOfBirth = new DateTime(1992, 4, 15, 0, 0, 0, DateTimeKind.Utc),
                    HireDate = new DateTime(2019, 3, 1, 0, 0, 0, DateTimeKind.Utc),
                    Position = "Tech Lead / Software Architect",
                    Salary = 45000000m,
                    Status = EmployeeStatus.Active,
                    DepartmentId = itDept.Id,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    FirstName = "Trần Thị",
                    LastName = "Bình",
                    Email = "binh.tran@company.com",
                    PhoneNumber = "0987654321",
                    DateOfBirth = new DateTime(1995, 8, 22, 0, 0, 0, DateTimeKind.Utc),
                    HireDate = new DateTime(2021, 6, 15, 0, 0, 0, DateTimeKind.Utc),
                    Position = "Senior Frontend Developer (Angular)",
                    Salary = 32000000m,
                    Status = EmployeeStatus.Active,
                    DepartmentId = itDept.Id,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    FirstName = "Lê Hoàng",
                    LastName = "Cường",
                    Email = "cuong.le@company.com",
                    PhoneNumber = "0934567890",
                    DateOfBirth = new DateTime(1997, 11, 10, 0, 0, 0, DateTimeKind.Utc),
                    HireDate = new DateTime(2022, 1, 10, 0, 0, 0, DateTimeKind.Utc),
                    Position = "Backend Developer (.NET / PostgreSQL)",
                    Salary = 26000000m,
                    Status = EmployeeStatus.Active,
                    DepartmentId = itDept.Id,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    FirstName = "Phạm Thu",
                    LastName = "Dung",
                    Email = "dung.pham@company.com",
                    PhoneNumber = "0901234567",
                    DateOfBirth = new DateTime(1993, 2, 28, 0, 0, 0, DateTimeKind.Utc),
                    HireDate = new DateTime(2020, 5, 20, 0, 0, 0, DateTimeKind.Utc),
                    Position = "Trưởng phòng Nhân Sự (HR Manager)",
                    Salary = 35000000m,
                    Status = EmployeeStatus.Active,
                    DepartmentId = hrDept.Id,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    FirstName = "Hoàng Minh",
                    LastName = "Đức",
                    Email = "duc.hoang@company.com",
                    PhoneNumber = "0978901234",
                    DateOfBirth = new DateTime(1998, 7, 5, 0, 0, 0, DateTimeKind.Utc),
                    HireDate = new DateTime(2023, 2, 1, 0, 0, 0, DateTimeKind.Utc),
                    Position = "Chuyên viên Tuyển dụng (Recruiter)",
                    Salary = 18000000m,
                    Status = EmployeeStatus.Active,
                    DepartmentId = hrDept.Id,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    FirstName = "Vũ Thị",
                    LastName = "Hà",
                    Email = "ha.vu@company.com",
                    PhoneNumber = "0945678912",
                    DateOfBirth = new DateTime(1991, 12, 18, 0, 0, 0, DateTimeKind.Utc),
                    HireDate = new DateTime(2018, 9, 1, 0, 0, 0, DateTimeKind.Utc),
                    Position = "Kế toán trưởng (Chief Accountant)",
                    Salary = 38000000m,
                    Status = EmployeeStatus.Active,
                    DepartmentId = finDept.Id,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    FirstName = "Đặng Quang",
                    LastName = "Hải",
                    Email = "hai.dang@company.com",
                    PhoneNumber = "0967890123",
                    DateOfBirth = new DateTime(1996, 3, 14, 0, 0, 0, DateTimeKind.Utc),
                    HireDate = new DateTime(2021, 11, 15, 0, 0, 0, DateTimeKind.Utc),
                    Position = "Chuyên viên Phân tích Tài chính",
                    Salary = 24000000m,
                    Status = EmployeeStatus.OnLeave,
                    DepartmentId = finDept.Id,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    FirstName = "Bùi Mai",
                    LastName = "Khanh",
                    Email = "khanh.bui@company.com",
                    PhoneNumber = "0918765432",
                    DateOfBirth = new DateTime(1994, 9, 9, 0, 0, 0, DateTimeKind.Utc),
                    HireDate = new DateTime(2020, 8, 1, 0, 0, 0, DateTimeKind.Utc),
                    Position = "Giám đốc Marketing (Marketing Director)",
                    Salary = 42000000m,
                    Status = EmployeeStatus.Active,
                    DepartmentId = mktDept.Id,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    FirstName = "Ngô Trọng",
                    LastName = "Long",
                    Email = "long.ngo@company.com",
                    PhoneNumber = "0923456781",
                    DateOfBirth = new DateTime(1999, 1, 25, 0, 0, 0, DateTimeKind.Utc),
                    HireDate = new DateTime(2023, 7, 1, 0, 0, 0, DateTimeKind.Utc),
                    Position = "Chuyên viên Digital Marketing",
                    Salary = 17500000m,
                    Status = EmployeeStatus.Active,
                    DepartmentId = mktDept.Id,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    FirstName = "Đỗ Thùy",
                    LastName = "Linh",
                    Email = "linh.do@company.com",
                    PhoneNumber = "0981234569",
                    DateOfBirth = new DateTime(1993, 6, 30, 0, 0, 0, DateTimeKind.Utc),
                    HireDate = new DateTime(2019, 10, 1, 0, 0, 0, DateTimeKind.Utc),
                    Position = "Nghiên cứu viên AI / Data Scientist",
                    Salary = 40000000m,
                    Status = EmployeeStatus.Active,
                    DepartmentId = rndDept.Id,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    FirstName = "Phan Quốc",
                    LastName = "Nam",
                    Email = "nam.phan@company.com",
                    PhoneNumber = "0932145678",
                    DateOfBirth = new DateTime(1990, 5, 12, 0, 0, 0, DateTimeKind.Utc),
                    HireDate = new DateTime(2017, 4, 1, 0, 0, 0, DateTimeKind.Utc),
                    Position = "DevOps & Cloud Engineer",
                    Salary = 36000000m,
                    Status = EmployeeStatus.Active,
                    DepartmentId = itDept.Id,
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    FirstName = "Lý Thị",
                    LastName = "Mai",
                    Email = "mai.ly@company.com",
                    PhoneNumber = "0909876543",
                    DateOfBirth = new DateTime(1989, 10, 20, 0, 0, 0, DateTimeKind.Utc),
                    HireDate = new DateTime(2016, 2, 1, 0, 0, 0, DateTimeKind.Utc),
                    Position = "Cựu Chuyên viên Nhân sự",
                    Salary = 20000000m,
                    Status = EmployeeStatus.Terminated,
                    DepartmentId = hrDept.Id,
                    CreatedAt = DateTime.UtcNow
                }
            };

            await context.Employees.AddRangeAsync(employees);
            await context.SaveChangesAsync();
        }
        // Seed Attendance
        if (!await context.Attendances.AnyAsync())
        {
            var activeEmployees = await context.Employees
                .Where(e => e.Status == EmployeeStatus.Active)
                .Take(8)
                .ToListAsync();

            var today = DateTime.UtcNow.Date;
            var attendances = new List<Attendance>();

            for (int daysAgo = 3; daysAgo >= 0; daysAgo--)
            {
                var recordDate = DateTime.SpecifyKind(today.AddDays(-daysAgo), DateTimeKind.Utc);
                if (recordDate.DayOfWeek == DayOfWeek.Saturday || recordDate.DayOfWeek == DayOfWeek.Sunday)
                    continue;

                int empIndex = 0;
                foreach (var emp in activeEmployees)
                {
                    empIndex++;
                    if (daysAgo == 0)
                    {
                        if (empIndex == 1)
                        {
                            attendances.Add(new Attendance
                            {
                                EmployeeId = emp.Id,
                                Date = recordDate,
                                CheckInTime = DateTime.SpecifyKind(recordDate.AddHours(8).AddMinutes(15), DateTimeKind.Utc),
                                CheckOutTime = DateTime.SpecifyKind(recordDate.AddHours(17).AddMinutes(30), DateTimeKind.Utc),
                                WorkingHours = 8.25m,
                                Status = AttendanceStatus.Present,
                                Notes = "�� ho�n th�nh ca l�m vi?c",
                                CreatedAt = DateTime.UtcNow
                            });
                        }
                        else if (empIndex == 2)
                        {
                            attendances.Add(new Attendance
                            {
                                EmployeeId = emp.Id,
                                Date = recordDate,
                                CheckInTime = DateTime.SpecifyKind(recordDate.AddHours(8).AddMinutes(20), DateTimeKind.Utc),
                                CheckOutTime = null,
                                WorkingHours = null,
                                Status = AttendanceStatus.Present,
                                Notes = "�ang l�m vi?c t?i van ph�ng",
                                CreatedAt = DateTime.UtcNow
                            });
                        }
                        else if (empIndex == 3)
                        {
                            attendances.Add(new Attendance
                            {
                                EmployeeId = emp.Id,
                                Date = recordDate,
                                CheckInTime = DateTime.SpecifyKind(recordDate.AddHours(8).AddMinutes(45), DateTimeKind.Utc),
                                CheckOutTime = null,
                                WorkingHours = null,
                                Status = AttendanceStatus.Late,
                                Notes = "T?c du?ng do?n ng� tu",
                                CreatedAt = DateTime.UtcNow
                            });
                        }
                    }
                    else
                    {
                        var isLate = empIndex % 4 == 0;
                        var isEarly = empIndex % 5 == 0;
                        var status = isLate ? AttendanceStatus.Late : (isEarly ? AttendanceStatus.EarlyLeave : AttendanceStatus.Present);
                        var checkInMin = isLate ? 45 : 15;
                        var checkOutHour = isEarly ? 16 : 17;

                        attendances.Add(new Attendance
                        {
                            EmployeeId = emp.Id,
                            Date = recordDate,
                            CheckInTime = DateTime.SpecifyKind(recordDate.AddHours(8).AddMinutes(checkInMin), DateTimeKind.Utc),
                            CheckOutTime = DateTime.SpecifyKind(recordDate.AddHours(checkOutHour).AddMinutes(30), DateTimeKind.Utc),
                            WorkingHours = isEarly ? 7.25m : 8.25m,
                            Status = status,
                            Notes = isLate ? "�i mu?n c� th�ng b�o tru?c" : (isEarly ? "Xin v? s?m gi?i quy?t vi?c gia d�nh" : null),
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }
            }

            if (attendances.Count > 0)
            {
                await context.Attendances.AddRangeAsync(attendances);
                await context.SaveChangesAsync();
            }
        }
    }
}
