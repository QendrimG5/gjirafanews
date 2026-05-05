FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY KafkaConsumer/KafkaConsumer.csproj KafkaConsumer/
RUN dotnet restore KafkaConsumer/KafkaConsumer.csproj
COPY KafkaConsumer/ KafkaConsumer/
RUN dotnet publish KafkaConsumer/KafkaConsumer.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/runtime:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "GjirafaNews.KafkaConsumer.dll"]
