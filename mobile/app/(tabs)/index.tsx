import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardScreen() {
  const { user } = useAuth();

  if (!user) return null;

  const isChild = user.role === 'CHILD';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {isChild ? '👋 Hey ' : '👨‍👩‍👧‍👦 Welcome back, '}
            {user.name}!
          </Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        {isChild ? <ChildDashboard /> : <ParentDashboard />}
      </ScrollView>
    </SafeAreaView>
  );
}

function ChildDashboard() {
  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 My Progress</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>$12.50</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>85%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>7</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Today's Chores</Text>
        <View style={styles.choresList}>
          <ChoreCard title="Make your bed" reward="$2.00" status="pending" />
          <ChoreCard title="Feed the dog" reward="$3.00" status="completed" />
          <ChoreCard title="Take out trash" reward="$5.00" status="pending" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <ActionButton 
            title="Chat with Chorbit" 
            subtitle="Get help with planning"
            emoji="🤖"
          />
          <ActionButton 
            title="Daily Check-in" 
            subtitle="How are you feeling?"
            emoji="💭"
          />
        </View>
      </View>
    </>
  );
}

function ParentDashboard() {
  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👨‍👩‍👧‍👦 Family Overview</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Pending Approvals</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>$47.50</Text>
            <Text style={styles.statLabel}>Weekly Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>92%</Text>
            <Text style={styles.statLabel}>Family Rate</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏳ Needs Your Approval</Text>
        <View style={styles.choresList}>
          <ApprovalCard 
            child="Noah" 
            chore="Made bed" 
            time="8:30 AM" 
            reward="$2.00" 
          />
          <ApprovalCard 
            child="Noah" 
            chore="Fed the dog" 
            time="7:45 AM" 
            reward="$3.00" 
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Family Insights</Text>
        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>🎯 This Week's Highlights</Text>
          <Text style={styles.insightText}>
            Noah has been consistently completing morning chores! 
            Consider discussing his interest in basketball for motivation.
          </Text>
        </View>
      </View>
    </>
  );
}

function ChoreCard({ title, reward, status }: { title: string; reward: string; status: 'pending' | 'completed' }) {
  return (
    <TouchableOpacity style={styles.choreCard}>
      <View style={styles.choreInfo}>
        <Text style={styles.choreTitle}>{title}</Text>
        <Text style={styles.choreReward}>{reward}</Text>
      </View>
      <View style={[styles.statusBadge, status === 'completed' && styles.completedBadge]}>
        <Text style={[styles.statusText, status === 'completed' && styles.completedText]}>
          {status === 'completed' ? '✅ Done' : '⏳ Todo'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function ApprovalCard({ child, chore, time, reward }: { child: string; chore: string; time: string; reward: string }) {
  return (
    <View style={styles.approvalCard}>
      <View style={styles.approvalInfo}>
        <Text style={styles.approvalChild}>{child}</Text>
        <Text style={styles.approvalChore}>{chore}</Text>
        <Text style={styles.approvalTime}>{time}</Text>
      </View>
      <View style={styles.approvalActions}>
        <Text style={styles.approvalReward}>{reward}</Text>
        <View style={styles.approvalButtons}>
          <TouchableOpacity style={styles.approveButton}>
            <Text style={styles.approveButtonText}>✅</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.denyButton}>
            <Text style={styles.denyButtonText}>❌</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function ActionButton({ title, subtitle, emoji }: { title: string; subtitle: string; emoji: string }) {
  return (
    <TouchableOpacity style={styles.actionButton}>
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <View style={styles.actionText}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  choresList: {
    gap: 8,
  },
  choreCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  choreInfo: {
    flex: 1,
  },
  choreTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  choreReward: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedBadge: {
    backgroundColor: '#d1fae5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400e',
  },
  completedText: {
    color: '#065f46',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  approvalCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  approvalInfo: {
    flex: 1,
  },
  approvalChild: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 2,
  },
  approvalChore: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  approvalTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  approvalActions: {
    alignItems: 'flex-end',
  },
  approvalReward: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 8,
  },
  approvalButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#10b981',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  denyButton: {
    backgroundColor: '#ef4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButtonText: {
    color: 'white',
    fontSize: 14,
  },
  denyButtonText: {
    color: 'white',
    fontSize: 14,
  },
  insightCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
}); 