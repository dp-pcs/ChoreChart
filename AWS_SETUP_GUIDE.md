# AWS Setup Guide for ChoreChart Email & SMS

Your ChoreChart app now supports **AWS SES (email)** and **AWS SNS (SMS)** for reliable invitation delivery. This is much better than Gmail SMTP!

## 🚀 **Why AWS is Better**

✅ **More Reliable**: Higher deliverability rates  
✅ **No Email Limits**: Unlike Gmail's daily sending limits  
✅ **Professional**: Emails come from your domain  
✅ **SMS Support**: Send text message invitations  
✅ **Scalable**: Handles high volume without issues  

## 📧 **Step 1: AWS SES (Email) Setup**

### 1.1 Create AWS Account
1. Go to [AWS Console](https://aws.amazon.com/console/)
2. Create account (free tier includes 62,000 emails/month!)

### 1.2 Set Up SES
1. Navigate to **Amazon SES** in AWS Console
2. Go to **Configuration** → **Verified Identities**
3. Click **Create Identity**
4. Choose **Domain** (recommended) or **Email Address**

**Option A: Domain Verification (Professional)**
- Enter your domain (e.g., `chorechart.com`)
- Follow DNS verification steps
- Allows sending from any `@yourdomain.com` address

**Option B: Email Verification (Quick Start)**
- Enter single email (e.g., `noreply@gmail.com`)
- Check email and click verification link
- Only allows sending from that specific address

### 1.3 Request Production Access
**Important**: SES starts in "Sandbox Mode" (can only email verified addresses)

1. Go to **Account Dashboard** in SES
2. Click **Request Production Access**
3. Use case: "Transactional emails for family organization app"
4. Usually approved within 24 hours

## 📱 **Step 2: AWS SNS (SMS) Setup**

### 2.1 Enable SNS
1. Navigate to **Amazon SNS** in AWS Console
2. Go to **Text Messaging (SMS)**
3. Click **Publish Text Message** to test

### 2.2 Set Spending Limits (Important!)
1. Go to **Text Messaging Preferences**
2. Set monthly spending limit (e.g., $10)
3. SMS costs ~$0.0075 per message in US

## 🔑 **Step 3: Get AWS Credentials**

### 3.1 Create IAM User
1. Go to **IAM** → **Users** → **Create User**
2. Username: `chorechart-app`
3. **Attach Policies Directly**:
   - `AmazonSESFullAccess`
   - `AmazonSNSFullAccess`
4. Go to **Security Credentials** → **Create Access Key**
5. Choose **Application Running Outside AWS**
6. Save **Access Key ID** and **Secret Access Key**

## ⚙️ **Step 4: Configure Environment Variables**

Update your `.env` file:

```bash
# AWS Configuration
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
AWS_SES_FROM_EMAIL="noreply@yourdomain.com"
```

## 🧪 **Step 5: Test the System**

1. **Enable Multiple Parents**:
   - Go to Family Settings in your app
   - Enable "Allow Multiple Parents"

2. **Test Email Invitation**:
   - Click "Invite Parent" in dashboard
   - Choose "📧 Email" option
   - Enter test email address
   - Check email delivery

3. **Test SMS Invitation**:
   - Click "Invite Parent" in dashboard  
   - Choose "📱 Text Message" option
   - Enter phone number (US format: 555-123-4567)
   - Check SMS delivery

## 🛠️ **Troubleshooting**

### Email Issues
- **Still in Sandbox?** Check SES Account Dashboard
- **Domain not verified?** Check DNS records
- **Wrong region?** Ensure AWS_REGION matches SES setup

### SMS Issues
- **No SMS received?** Check SNS spending limits
- **Invalid number?** Use US format: +1-555-123-4567
- **Blocked number?** Some carriers block promotional SMS

### Permission Issues
- **Access Denied?** Check IAM user has SES/SNS permissions
- **Wrong credentials?** Verify Access Key ID/Secret

## 💰 **Costs**

- **SES**: $0.10 per 1,000 emails (first 62,000/month free)
- **SNS**: $0.0075 per SMS in US
- **Very affordable** for family use!

## 🔒 **Security Best Practices**

1. **Limit IAM Permissions**: Only give SES + SNS access
2. **Use Environment Variables**: Never commit credentials to code
3. **Set Spending Limits**: Prevent unexpected charges
4. **Monitor Usage**: Check AWS billing dashboard

## 🎉 **You're All Set!**

Your ChoreChart app now has:
- ✅ Professional email delivery via AWS SES
- ✅ SMS invitations via AWS SNS  
- ✅ Better reliability than Gmail SMTP
- ✅ Scalable for family growth

**Need Help?** Check the AWS documentation or create an issue in the repository.

---
*This setup replaces the old SMTP configuration and provides much better email delivery for your family's invitations!*