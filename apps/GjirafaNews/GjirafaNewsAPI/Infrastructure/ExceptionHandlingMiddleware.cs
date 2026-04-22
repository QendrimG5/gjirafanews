using System.Text.Json;
using GjirafaNewsAPI.Models;
using DataAnnotationsValidationException = System.ComponentModel.DataAnnotations.ValidationException;
using FluentValidationException = FluentValidation.ValidationException;

namespace GjirafaNewsAPI.Infrastructure
{
    public sealed class ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await next(context);
            }
            catch (FluentValidationException ex)
            {
                logger.LogWarning(ex, "Validation failed on {Method} {Path}", context.Request.Method, context.Request.Path);
                var errors = ex.Errors
                    .Select(e => new ApiError(e.PropertyName, e.ErrorMessage))
                    .ToList();
                await WriteAsync(
                    context,
                    StatusCodes.Status400BadRequest,
                    ApiResponse<object>.Fail("Validation failed", errors));
            }
            catch (DataAnnotationsValidationException ex)
            {
                logger.LogWarning(ex, "Validation error on {Method} {Path}", context.Request.Method, context.Request.Path);
                await WriteAsync(
                    context,
                    StatusCodes.Status400BadRequest,
                    ApiResponse<object>.Fail(ex.Message));
            }
            catch (KeyNotFoundException ex)
            {
                logger.LogWarning(ex, "Resource not found on {Method} {Path}", context.Request.Method, context.Request.Path);
                await WriteAsync(
                    context,
                    StatusCodes.Status404NotFound,
                    ApiResponse<object>.Fail(ex.Message));
            }
        }

        private static Task WriteAsync(HttpContext context, int status, ApiResponse<object> body)
        {
            if (context.Response.HasStarted)
            {
                return Task.CompletedTask;
            }

            context.Response.Clear();
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/json";
            return JsonSerializer.SerializeAsync(context.Response.Body, body, JsonOptions, context.RequestAborted);
        }
    }
}
