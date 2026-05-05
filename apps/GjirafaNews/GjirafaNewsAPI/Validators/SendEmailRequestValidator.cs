using FluentValidation;
using GjirafaNewsAPI.Models.Dtos;

namespace GjirafaNewsAPI.Validators;

public class SendEmailRequestValidator : AbstractValidator<SendEmailRequest>
{
    public SendEmailRequestValidator()
    {
        RuleFor(x => x.To).NotEmpty().EmailAddress().MaximumLength(320);
        RuleFor(x => x.Subject).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Body).NotEmpty().MaximumLength(50_000);
    }
}

public class ScheduleEmailRequestValidator : AbstractValidator<ScheduleEmailRequest>
{
    public ScheduleEmailRequestValidator()
    {
        RuleFor(x => x.To).NotEmpty().EmailAddress().MaximumLength(320);
        RuleFor(x => x.Subject).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Body).NotEmpty().MaximumLength(50_000);
        RuleFor(x => x.DelaySeconds).InclusiveBetween(0, 60 * 60 * 24 * 30);
    }
}
