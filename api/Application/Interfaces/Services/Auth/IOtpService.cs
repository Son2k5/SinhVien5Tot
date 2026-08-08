using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;


namespace SV5T.Application.Interfaces.Services.Auth
{
    public interface IOtpService
    {
        int ExpiryMinutes { get; }
        int MaxAttempts { get; }
        string Generate();
        string Hash(string otp);
        bool FixedTimeEquals(string leftHash, string rightHash);
    }
}
