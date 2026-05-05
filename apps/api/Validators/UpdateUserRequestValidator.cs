using FluentValidation;
using GjirafaNewsAPI.Models.Dtos;

namespace GjirafaNewsAPI.Validators
{
    public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
    {
        public UpdateUserRequestValidator()
        {
            RuleFor(x => x.Name).ValidUserName();
            RuleFor(x => x.Email).ValidUserEmail();
        }
    }
}
