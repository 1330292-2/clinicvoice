import { google } from 'googleapis';
import type { Appointment } from '@shared/schema';

export class GoogleSheetsService {
  private sheets: any;
  private auth: any;

  constructor(serviceAccountKey: any) {
    if (!serviceAccountKey) {
      throw new Error('Google Service Account Key is required');
    }

    // Create JWT auth client
    this.auth = new google.auth.JWT({
      email: serviceAccountKey.client_email,
      key: serviceAccountKey.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file']
    });

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  async createPatientSheet(clinicName: string): Promise<string> {
    try {
      // Create a new spreadsheet
      const response = await this.sheets.spreadsheets.create({
        resource: {
          properties: {
            title: `${clinicName} - Patient Records`,
          },
          sheets: [
            {
              properties: {
                title: 'Patient Appointments',
              },
            },
          ],
        },
      });

      const spreadsheetId = response.data.spreadsheetId;

      // Add headers to the sheet
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Patient Appointments!A1:H1',
        valueInputOption: 'RAW',
        resource: {
          values: [
            [
              'Patient Name',
              'Phone Number',
              'Appointment Date',
              'Appointment Type',
              'Status',
              'Notes',
              'Created At',
              'Updated At',
            ],
          ],
        },
      });

      return spreadsheetId;
    } catch (error) {
      console.error('Error creating Google Sheet:', error);
      throw new Error('Failed to create Google Sheet');
    }
  }

  async addPatientRecord(
    spreadsheetId: string,
    appointment: Appointment
  ): Promise<void> {
    try {
      const values = [
        [
          appointment.patientName,
          appointment.patientPhone || '',
          appointment.appointmentDate?.toISOString() || '',
          appointment.appointmentType || '',
          appointment.status || '',
          appointment.notes || '',
          appointment.createdAt?.toISOString() || '',
          appointment.updatedAt?.toISOString() || '',
        ],
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Patient Appointments!A:H',
        valueInputOption: 'RAW',
        resource: {
          values,
        },
      });
    } catch (error) {
      console.error('Error adding patient record to Google Sheet:', error);
      throw new Error('Failed to add patient record to Google Sheet');
    }
  }

  async updatePatientRecord(
    spreadsheetId: string,
    appointment: Appointment,
    rowIndex: number
  ): Promise<void> {
    try {
      const values = [
        [
          appointment.patientName,
          appointment.patientPhone || '',
          appointment.appointmentDate?.toISOString() || '',
          appointment.appointmentType || '',
          appointment.status || '',
          appointment.notes || '',
          appointment.createdAt?.toISOString() || '',
          appointment.updatedAt?.toISOString() || '',
        ],
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Patient Appointments!A${rowIndex + 1}:H${rowIndex + 1}`,
        valueInputOption: 'RAW',
        resource: {
          values,
        },
      });
    } catch (error) {
      console.error('Error updating patient record in Google Sheet:', error);
      throw new Error('Failed to update patient record in Google Sheet');
    }
  }

  async shareSheet(spreadsheetId: string, email: string): Promise<void> {
    try {
      const drive = google.drive({ version: 'v3', auth: this.auth });
      
      await drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
          role: 'writer',
          type: 'user',
          emailAddress: email,
        },
      });
    } catch (error) {
      console.error('Error sharing Google Sheet:', error);
      throw new Error('Failed to share Google Sheet');
    }
  }
}