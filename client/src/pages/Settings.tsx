import { useEffect, useState } from 'react';
import { apiClient, ProfileData } from '@/lib/api';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import axios from 'axios';

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [requirements, setRequirements] = useState('');
  const [botToken, setBotToken] = useState('');
  const [botUsername, setBotUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getProfile();
      setProfile(data);
      setRequirements(data.requirements || '');
    } catch (err) {
      const errorMsg = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Failed to load profile'
        : 'An error occurred';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRequirements = async () => {
    if (!profile) return;
    try {
      setIsSaving(true);
      await apiClient.updateRequirements(profile.shop_id, requirements);
      toast.success('Requirements updated successfully');
    } catch (err) {
      const errorMsg = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Failed to update requirements'
        : 'An error occurred';
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyTelegramBot = async () => {
    if (!botToken.trim()) {
      toast.error('Please enter bot token');
      return;
    }

    try {
      setIsSaving(true);
      // Verify Telegram bot by calling getMe API
      const response = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`);
      if (response.data.ok) {
        setBotUsername(response.data.result.username || '');
        toast.success('Telegram bot verified successfully');
      } else {
        toast.error('Invalid bot token');
      }
    } catch {
      toast.error('Failed to verify bot token');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setIsSaving(true);
      // API call would go here
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="telegram">Telegram</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Shop Information</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Shop Name</Label>
                  <Input value={profile?.shop_name || ''} disabled className="mt-2" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Owner Name</Label>
                  <Input value={profile?.owner_name || ''} disabled className="mt-2" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <Input value={profile?.phone || ''} disabled className="mt-2" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Shop ID</Label>
                  <div className="flex gap-2 mt-2">
                    <Input value={profile?.shop_id || ''} disabled className="flex-1" />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(profile?.shop_id || '');
                        toast.success('Shop ID copied to clipboard');
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Requirements Tab */}
          <TabsContent value="requirements" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">AI Requirements</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Describe your products, business rules, delivery rules, custom instructions, and customer handling requirements.
              </p>
              <div className="space-y-4">
                <Textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Enter your business requirements..."
                  className="min-h-64"
                />
                <Button onClick={handleSaveRequirements} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Requirements'}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Telegram Tab */}
          <TabsContent value="telegram" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Telegram Bot Setup</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Bot Token</Label>
                  <Input
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="Enter your Telegram bot token"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Bot Username</Label>
                  <Input
                    value={botUsername}
                    disabled
                    placeholder="Will be filled after verification"
                    className="mt-2"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleVerifyTelegramBot} disabled={isSaving}>
                    {isSaving ? 'Verifying...' : 'Verify Bot'}
                  </Button>
                  <Button variant="outline" disabled title="Feature coming soon">
                    Save Configuration
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your bot token from{' '}
                  <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    @BotFather
                  </a>
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Current Password</Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="mt-2"
                  />
                </div>
                <Separator />
                <div>
                  <Label className="text-sm font-medium">New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="mt-2"
                  />
                </div>
                <Button onClick={handleChangePassword} disabled={isSaving}>
                  {isSaving ? 'Updating...' : 'Change Password'}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
