using FluentValidation;
using GjirafaNewsAPI.Models.Dtos;

namespace GjirafaNewsAPI.Validators
{
    public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
    {
        public CreateUserRequestValidator()
        {
            RuleFor(x => x.Name).ValidUserName();
            RuleFor(x => x.Email).ValidUserEmail();
        }
    }
}
