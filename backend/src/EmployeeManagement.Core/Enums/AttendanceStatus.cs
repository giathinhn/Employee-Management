namespace EmployeeManagement.Core.Enums;

public enum AttendanceStatus
{
    Present = 1,           // Có mặt / Đúng giờ
    Late = 2,              // Đi muộn
    EarlyLeave = 3,        // Về sớm
    LateAndEarlyLeave = 4, // Đi muộn & Về sớm
    Absent = 5,            // Vắng mặt
    OnLeave = 6            // Nghỉ phép
}
