using System.ComponentModel.DataAnnotations;

namespace Gardrop.Core.Application.Common.DTOs;

public record ReviewDto(
    [Required(ErrorMessage = "Reytinq mütləqdir")]
    [Range(1, 5, ErrorMessage = "Reytinq 1-5 arası olmalıdır")] int? Rating,
    string? Comment, List<string>? ImageUrls);

// Satıcının müştəri rəyinə cavabı
public record ReviewReplyDto(string? Reply);
