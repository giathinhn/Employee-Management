# Multi-stage build for ASP.NET Core 8 Web API
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy solution and project files first for efficient caching
COPY EmployeeManagement.sln .
COPY src/EmployeeManagement.Core/*.csproj src/EmployeeManagement.Core/
COPY src/EmployeeManagement.Infrastructure/*.csproj src/EmployeeManagement.Infrastructure/
COPY src/EmployeeManagement.API/*.csproj src/EmployeeManagement.API/
COPY tests/EmployeeManagement.Tests/*.csproj tests/EmployeeManagement.Tests/

# Restore dependencies
RUN dotnet restore

# Copy all source files and publish
COPY . .
RUN dotnet publish src/EmployeeManagement.API/EmployeeManagement.API.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
EXPOSE 5000

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "EmployeeManagement.API.dll"]
