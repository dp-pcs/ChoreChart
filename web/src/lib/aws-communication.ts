import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'

// Initialize AWS clients
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export interface EmailData {
  to: string
  subject: string
  htmlContent: string
  textContent?: string
}

export interface SMSData {
  phoneNumber: string
  message: string
}

export async function sendEmailWithSES(emailData: EmailData): Promise<void> {
  const command = new SendEmailCommand({
    Source: process.env.AWS_SES_FROM_EMAIL || 'noreply@chorechart.com',
    Destination: {
      ToAddresses: [emailData.to],
    },
    Message: {
      Subject: {
        Data: emailData.subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: emailData.htmlContent,
          Charset: 'UTF-8',
        },
        Text: {
          Data: emailData.textContent || emailData.htmlContent.replace(/<[^>]*>/g, ''),
          Charset: 'UTF-8',
        },
      },
    },
  })

  try {
    const result = await sesClient.send(command)
    console.log('Email sent successfully via SES:', result.MessageId)
  } catch (error) {
    console.error('Error sending email via SES:', error)
    throw error
  }
}

export async function sendSMSWithSNS(smsData: SMSData): Promise<void> {
  // Format phone number to E.164 format if not already
  let formattedPhone = smsData.phoneNumber.replace(/[^\d+]/g, '')
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = '+1' + formattedPhone // Assume US if no country code
  }

  const command = new PublishCommand({
    PhoneNumber: formattedPhone,
    Message: smsData.message,
    MessageAttributes: {
      'AWS.SNS.SMS.SMSType': {
        DataType: 'String',
        StringValue: 'Transactional', // Use 'Promotional' for marketing messages
      },
    },
  })

  try {
    const result = await snsClient.send(command)
    console.log('SMS sent successfully via SNS:', result.MessageId)
  } catch (error) {
    console.error('Error sending SMS via SNS:', error)
    throw error
  }
}

export function generateInvitationEmailHTML(
  inviterName: string,
  familyName: string,
  recipientName: string | null,
  isExistingUser: boolean,
  inviteUrl: string
): string {
  const greeting = recipientName ? `Hi ${recipientName}!` : 'Hello!'
  const actionText = isExistingUser ? 'Join Family' : 'Create Account & Join'
  const instructionText = isExistingUser 
    ? 'Click the button below to join this family with your existing ChoreChart account:'
    : 'Click the button below to create your ChoreChart account and join this family:'

  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; font-size: 28px; margin-bottom: 10px;">🏡 ChoreChart</h1>
        <p style="color: #666; font-size: 16px;">Smart family chore management with AI</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">Family Invitation</h2>
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          ${greeting}
        </p>
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          <strong>${inviterName}</strong> has invited you to join the <strong>${familyName}</strong> family on ChoreChart! 
          You'll be able to help manage chores, approve submissions, and keep the family organized.
        </p>
        <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
          ${instructionText}
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" 
             style="background: linear-gradient(45deg, #3b82f6, #8b5cf6); 
                    color: white; 
                    padding: 14px 30px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    font-weight: bold; 
                    font-size: 16px; 
                    display: inline-block;">
            ${actionText}
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This invitation will expire in 7 days for security reasons.
        </p>
        
        <p style="color: #666; font-size: 14px; margin-top: 10px;">
          If the button doesn't work, copy and paste this link into your browser:
          <br>
          <a href="${inviteUrl}" style="color: #3b82f6; word-break: break-all;">${inviteUrl}</a>
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>This email was sent from ChoreChart. If you have any questions, please contact support.</p>
        <p>Family: ${familyName} | Invited by: ${inviterName}</p>
      </div>
    </div>
  `
}

export function generateInvitationSMS(
  inviterName: string,
  familyName: string,
  inviteUrl: string
): string {
  return `🏡 ChoreChart Family Invitation

${inviterName} invited you to join the ${familyName} family!

Join here: ${inviteUrl}

Reply STOP to opt out.`
}

// Helper function to validate phone number format
export function isValidPhoneNumber(phone: string): boolean {
  // Basic validation for US phone numbers
  const phoneRegex = /^(\+1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/
  const cleanPhone = phone.replace(/[^\d+]/g, '')
  return phoneRegex.test(cleanPhone) || phoneRegex.test('+1' + cleanPhone)
}

// Helper function to validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}