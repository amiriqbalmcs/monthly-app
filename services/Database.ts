import * as SQLite from 'expo-sqlite';
import { Group, Participant, Contribution } from '@/types';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize() {
    this.db = await SQLite.openDatabaseAsync('contribution_tracke.db');
    await this.createTables();
  }

  private async createTables() {
    if (!this.db) return;

    // Create groups table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        monthly_amount REAL NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'USD',
        created_at DATETIME DEFAULT '2025-01-01 00:00:00',
        is_active INTEGER DEFAULT 1
      );
    `);

    // Create participants table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        monthly_contribution REAL NOT NULL DEFAULT 0,
        joined_date DATE DEFAULT CURRENT_DATE,
        status TEXT NOT NULL DEFAULT 'active',
        FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
      );
    `);

    // Create contributions table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS contributions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        participant_id INTEGER NOT NULL,
        group_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        note TEXT,
        date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (participant_id) REFERENCES participants (id) ON DELETE CASCADE,
        FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
      );
    `);
  }

  async seedSampleData() {
    if (!this.db) return;

    // Check if we already have data
    const groupCount = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM groups');
    if ((groupCount as any)?.count > 0) return;

    // Sample groups
    const groups = [
      {
        name: 'August Blood Donation Camp',
        description: 'Monthly blood donation drive with volunteer coordination',
        monthly_amount: 500,
        currency: 'USD'
      },
      {
        name: 'Football Club 2025',
        description: 'Monthly participation fees for club activities and equipment',
        monthly_amount: 200,
        currency: 'USD'
      },
      {
        name: 'Charity Drive for Flood Relief',
        description: 'Fundraising campaign for disaster relief efforts',
        monthly_amount: 1000,
        currency: 'USD'
      }
    ];

    for (const group of groups) {
      const result = await this.db.runAsync(
        'INSERT INTO groups (name, description, monthly_amount, currency) VALUES (?, ?, ?, ?)',
        [group.name, group.description, group.monthly_amount, group.currency]
      );

      // Add sample participants for each group
      const participants = [
        { name: 'John Doe', email: 'john@example.com', phone: '+1-555-0101', contribution: 50 },
        { name: 'Jane Smith', email: 'jane@example.com', phone: '+1-555-0102', contribution: 75 },
        { name: 'Mike Johnson', email: 'mike@example.com', phone: '+1-555-0103', contribution: 60 },
        { name: 'Sarah Wilson', email: 'sarah@example.com', phone: '+1-555-0104', contribution: 80 }
      ];

      for (const participant of participants) {
        const participantResult = await this.db.runAsync(
          'INSERT INTO participants (group_id, name, email, phone, monthly_contribution, status) VALUES (?, ?, ?, ?, ?, ?)',
          [result.lastInsertRowId, participant.name, participant.email, participant.phone, participant.contribution, 'active']
        );

        // Add sample contributions for the last 3 months
        const months = ['2025-01-15', '2025-02-15', '2025-03-15'];
        for (const date of months) {
          await this.db.runAsync(
            'INSERT INTO contributions (participant_id, group_id, amount, note, date) VALUES (?, ?, ?, ?, ?)',
            [participantResult.lastInsertRowId, result.lastInsertRowId, participant.contribution, 'Monthly contribution', date]
          );
        }
      }
    }
  }

  async getGroups(): Promise<Group[]> {
    if (!this.db) return [];
    return await this.db.getAllAsync('SELECT * FROM groups ORDER BY created_at DESC') as Group[];
  }

  async getParticipants(): Promise<Participant[]> {
    if (!this.db) return [];
    return await this.db.getAllAsync('SELECT * FROM participants ORDER BY name ASC') as Participant[];
  }

  async getContributions(): Promise<Contribution[]> {
    if (!this.db) return [];
    return await this.db.getAllAsync('SELECT * FROM contributions ORDER BY date DESC') as Contribution[];
  }

  async getGroupHistory(groupId: number): Promise<{
    months: string[];
    monthlyData: { [month: string]: { total: number; count: number; participants: number } };
  }> {
    if (!this.db) return { months: [], monthlyData: {} };

    const contributions = await this.db.getAllAsync(`
      SELECT 
        c.*,
        strftime('%Y-%m', c.date) as month
      FROM contributions c
      WHERE c.group_id = ?
      ORDER BY c.date ASC
    `, [groupId]) as (Contribution & { month: string })[];

    const participants = await this.db.getAllAsync(`
      SELECT * FROM participants WHERE group_id = ? AND status = 'active'
    `, [groupId]) as Participant[];

    const monthlyData: { [month: string]: { total: number; count: number; participants: number } } = {};
    const months: string[] = [];

    contributions.forEach(contrib => {
      if (!monthlyData[contrib.month]) {
        monthlyData[contrib.month] = { total: 0, count: 0, participants: 0 };
        months.push(contrib.month);
      }
      monthlyData[contrib.month].total += contrib.amount;
      monthlyData[contrib.month].count += 1;
    });

    // Calculate unique participants per month
    Object.keys(monthlyData).forEach(month => {
      const monthContribs = contributions.filter(c => c.month === month);
      const uniqueParticipants = new Set(monthContribs.map(c => c.participant_id));
      monthlyData[month].participants = uniqueParticipants.size;
    });

    return { months: months.sort(), monthlyData };
  }

  async addGroup(group: Omit<Group, 'id'>): Promise<void> {
    if (!this.db) return;
    await this.db.runAsync(
      'INSERT INTO groups (name, description, monthly_amount, is_active) VALUES (?, ?, ?, ?)',
      [group.name, group.description, group.monthly_amount, group.is_active]
    );
  }

  async updateGroup(id: number, group: Partial<Group>): Promise<void> {
    if (!this.db) return;
    const fields = Object.keys(group).map(key => `${key} = ?`).join(', ');
    const values = Object.values(group);
    await this.db.runAsync(
      `UPDATE groups SET ${fields} WHERE id = ?`,
      [...values, id]
    );
  }

  async deleteGroup(id: number): Promise<void> {
    if (!this.db) return;
    await this.db.runAsync('DELETE FROM groups WHERE id = ?', [id]);
  }

  async addParticipant(participant: Omit<Participant, 'id'>): Promise<void> {
    if (!this.db) return;
    await this.db.runAsync(
      'INSERT INTO participants (group_id, name, email, phone, monthly_contribution, joined_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [participant.group_id, participant.name, participant.email, participant.phone, participant.monthly_contribution, participant.joined_date, participant.status]
    );
  }

  async updateParticipant(id: number, participant: Partial<Participant>): Promise<void> {
    if (!this.db) return;
    
    // If group_id is being changed, update all contributions for this participant
    if (participant.group_id !== undefined) {
      await this.db.runAsync(
        'UPDATE contributions SET group_id = ? WHERE participant_id = ?',
        [participant.group_id, id]
      );
    }
    
    const fields = Object.keys(participant).map(key => `${key} = ?`).join(', ');
    const values = Object.values(participant);
    await this.db.runAsync(
      `UPDATE participants SET ${fields} WHERE id = ?`,
      [...values, id]
    );
  }

  async deleteParticipant(id: number): Promise<void> {
    if (!this.db) return;
    await this.db.runAsync('DELETE FROM participants WHERE id = ?', [id]);
  }

  async addContribution(contribution: Omit<Contribution, 'id'>): Promise<void> {
    if (!this.db) return;
    await this.db.runAsync(
      'INSERT INTO contributions (participant_id, group_id, amount, note, date) VALUES (?, ?, ?, ?, ?)',
      [contribution.participant_id, contribution.group_id, contribution.amount, contribution.note, contribution.date]
    );
  }

  async updateContribution(id: number, contribution: Partial<Contribution>): Promise<void> {
    if (!this.db) return;
    const fields = Object.keys(contribution).map(key => `${key} = ?`).join(', ');
    const values = Object.values(contribution);
    await this.db.runAsync(
      `UPDATE contributions SET ${fields} WHERE id = ?`,
      [...values, id]
    );
  }

  async deleteContribution(id: number): Promise<void> {
    if (!this.db) return;
    await this.db.runAsync('DELETE FROM contributions WHERE id = ?', [id]);
  }

  async clearAllData(): Promise<void> {
    if (!this.db) return;
    await this.db.execAsync(`
      DELETE FROM contributions;
      DELETE FROM participants;
      DELETE FROM groups;
    `);
  }

  async resetDatabase(): Promise<void> {
    if (!this.db) return;
    
    // Clear all data
    await this.clearAllData();
    
    // Recreate tables (in case of schema changes)
    await this.createTables();
    
    // Seed with sample data
    await this.seedSampleData();
  }
  
  async importData(data: any): Promise<void> {
    if (!this.db) return;

    // Import groups
    for (const group of data.groups) {
      await this.db.runAsync(
        'INSERT INTO groups (name, description, monthly_amount, currency, created_at, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [group.name, group.description, group.monthly_amount, group.currency, group.created_at, group.is_active]
      );
    }

    // Import participants
    for (const participant of data.participants) {
      await this.db.runAsync(
        'INSERT INTO participants (group_id, name, email, phone, monthly_contribution, joined_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [participant.group_id, participant.name, participant.email, participant.phone, participant.monthly_contribution, participant.joined_date, participant.status]
      );
    }

    // Import contributions
    for (const contribution of data.contributions) {
      await this.db.runAsync(
        'INSERT INTO contributions (participant_id, group_id, amount, note, date, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [contribution.participant_id, contribution.group_id, contribution.amount, contribution.note, contribution.date, contribution.created_at]
      );
    }
  }
}

export const Database = new DatabaseService();