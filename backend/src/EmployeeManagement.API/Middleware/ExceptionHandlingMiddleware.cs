using System.Net;
using System.Text.Json;
using EmployeeManagement.Core.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var response = context.Response;
        response.ContentType = "application/json";

        var problemDetails = new ProblemDetails
        {
            Instance = context.Request.Path
        };

        switch (exception)
        {
            case NotFoundException notFoundEx:
                response.StatusCode = (int)HttpStatusCode.NotFound;
                problemDetails.Status = response.StatusCode;
                problemDetails.Title = "Resource Not Found";
                problemDetails.Detail = notFoundEx.Message;
                _logger.LogWarning("Not found: {Message}", notFoundEx.Message);
                break;

            case ValidationException valEx:
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                problemDetails.Status = response.StatusCode;
                problemDetails.Title = "Validation Error";
                problemDetails.Detail = valEx.Message;
                if (valEx.Errors != null && valEx.Errors.Count > 0)
                {
                    problemDetails.Extensions["errors"] = valEx.Errors;
                }
                _logger.LogWarning("Validation failure: {Message}", valEx.Message);
                break;

            case ConflictException conflictEx:
                response.StatusCode = (int)HttpStatusCode.Conflict;
                problemDetails.Status = response.StatusCode;
                problemDetails.Title = "Conflict";
                problemDetails.Detail = conflictEx.Message;
                _logger.LogWarning("Conflict: {Message}", conflictEx.Message);
                break;

            default:
                response.StatusCode = (int)HttpStatusCode.InternalServerError;
                problemDetails.Status = response.StatusCode;
                problemDetails.Title = "Internal Server Error";
                problemDetails.Detail = "Đã xảy ra lỗi máy chủ không mong muốn. Vui lòng thử lại sau.";
                _logger.LogError(exception, "Unhandled exception occurred: {Message}", exception.Message);
                break;
        }

        var json = JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await response.WriteAsync(json);
    }
}
