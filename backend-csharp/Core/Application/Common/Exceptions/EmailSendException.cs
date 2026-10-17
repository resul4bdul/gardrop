namespace Gardrop.Core.Application.Common.Exceptions;

/// <summary>Email göndərilə bilmədikdə atılan istisna (servis 502 qaytarır).</summary>
public class EmailSendException : Exception
{
    public EmailSendException(string message, Exception? inner = null) : base(message, inner) { }
}
