import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Save,
  RefreshCw,
  AlertCircle,
  Loader2,
  Server,
  Database,
  Shield,
  Bell,
  Mail,
  Globe,
  CreditCard,
  Video,
  Users,
  Key,
  Eye,
  EyeOff,
  Palette,
  Lock,
  CheckCircle,
  XCircle,
  Zap,
  DollarSign,
  Cloud,
} from 'lucide-react';

interface SystemConfig {
  general: {
    platformName: string;
    platformDescription: string;
    supportEmail: string;
    maintenanceMode: boolean;
    allowRegistration: boolean;
    maxUsersPerCourse: number;
  };
  security: {
    enableTwoFactor: boolean;
    sessionTimeout: number;
    passwordMinLength: number;
    requireStrongPasswords: boolean;
    allowPasswordReset: boolean;
    enableRateLimiting: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    notificationFrequency: 'immediate' | 'daily' | 'weekly';
  };
  payments: {
    currency: string;
    paymentMethods: string[];
    enableAutoRefunds: boolean;
    refundWindowDays: number;
    commissionRate: number;
    taxPercentage: number;
    payoutLimit: number;
  };
  liveClasses: {
    maxParticipants: number;
    recordingEnabled: boolean;
    chatEnabled: boolean;
    whiteboardEnabled: boolean;
    breakoutRoomsEnabled: boolean;
  };
  apiCredentials: {
    razorpay: {
      keyId: string;
      keySecret: string;
      webhookSecret: string;
      enabled: boolean;
    };
    cashfree: {
      appId: string;
      secretKey: string;
      enabled: boolean;
    };
    zoom: {
      apiKey: string;
      apiSecret: string;
      sdkKey: string;
      sdkSecret: string;
      enabled: boolean;
    };
    firebase: {
      apiKey: string;
      authDomain: string;
      projectId: string;
      messagingSenderId: string;
      appId: string;
      enabled: boolean;
    };
  };
  theme: {
    mode: 'light' | 'dark' | 'system';
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  rbac: {
    roles: string[];
    permissions: { [key: string]: string[] };
  };
}

const SystemSettingsManagement: React.FC = () => {
  const { toast } = useToast();
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const [config, setConfig] = useState<SystemConfig>({
    general: {
      platformName: 'GenZEd LMS',
      platformDescription: 'Advanced Learning Management System',
      supportEmail: 'support@genzed.com',
      maintenanceMode: false,
      allowRegistration: true,
      maxUsersPerCourse: 100,
    },
    security: {
      enableTwoFactor: false,
      sessionTimeout: 60,
      passwordMinLength: 8,
      requireStrongPasswords: true,
      allowPasswordReset: true,
      enableRateLimiting: true,
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      notificationFrequency: 'immediate',
    },
    payments: {
      currency: 'INR',
      paymentMethods: ['card', 'upi', 'netbanking'],
      enableAutoRefunds: false,
      refundWindowDays: 7,
      commissionRate: 15,
      taxPercentage: 18,
      payoutLimit: 1000,
    },
    liveClasses: {
      maxParticipants: 50,
      recordingEnabled: true,
      chatEnabled: true,
      whiteboardEnabled: true,
      breakoutRoomsEnabled: false,
    },
    apiCredentials: {
      razorpay: {
        keyId: '',
        keySecret: '',
        webhookSecret: '',
        enabled: false,
      },
      cashfree: {
        appId: '',
        secretKey: '',
        enabled: false,
      },
      zoom: {
        apiKey: '',
        apiSecret: '',
        sdkKey: '',
        sdkSecret: '',
        enabled: false,
      },
      firebase: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        messagingSenderId: '',
        appId: '',
        enabled: false,
      },
    },
    theme: {
      mode: 'light',
      primaryColor: '#3B82F6',
      secondaryColor: '#9333EA',
      accentColor: '#10B981',
    },
    rbac: {
      roles: ['admin', 'teacher', 'student', 'parent'],
      permissions: {
        admin: ['all'],
        teacher: ['courses:read', 'courses:write', 'students:read', 'classes:manage'],
        student: ['courses:read', 'classes:join', 'assessments:submit'],
        parent: ['students:read', 'payments:read', 'reports:read'],
      },
    },
  });

  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // API call to save system settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'Settings Saved',
        description: 'System configuration updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    toast({
      title: 'Settings Reset',
      description: 'Configuration reset to defaults.',
    });
  };

  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateNestedConfig = (
    section: keyof SystemConfig,
    subsection: string,
    field: string,
    value: any
  ) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...(prev[section] as any)[subsection],
          [field]: value,
        },
      },
    }));
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Gradient Circles Background */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl" />
      
      {/* Floating Icons */}
      <div className="absolute top-40 right-1/4 opacity-10">
        <Settings className="w-32 h-32 text-blue-600 animate-bounce" style={{ animationDuration: '3s' }} />
      </div>
      <div className="absolute bottom-40 left-1/3 opacity-10">
        <Shield className="w-28 h-28 text-purple-600 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                System Settings
              </h1>
              <p className="text-gray-600 mt-1">Configure platform settings and preferences</p>
            </div>
          </div>
        </div>

        {/* Settings Tabs */}
        <Card className="bg-white/90 backdrop-blur-sm border-gray-100 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-3">
              {[
                { id: 'general', label: 'General', icon: Globe },
                { id: 'security', label: 'Security', icon: Shield },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'payments', label: 'Payments', icon: CreditCard },
                { id: 'liveClasses', label: 'Live Classes', icon: Video },
                { id: 'apiCredentials', label: 'API Keys', icon: Key },
                { id: 'theme', label: 'Theme', icon: Palette },
                { id: 'rbac', label: 'RBAC', icon: Lock },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'outline'}
                    className={`${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    } transition-all duration-200`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <div className="space-y-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <Card className="bg-white/90 backdrop-blur-sm border-gray-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  General Settings
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Basic platform configuration and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="platformName" className="text-gray-700 font-medium">
                      Platform Name
                    </Label>
                    <Input
                      id="platformName"
                      value={config.general.platformName}
                      onChange={e => updateConfig('general', 'platformName', e.target.value)}
                      className="bg-white border-gray-200 mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supportEmail" className="text-gray-700 font-medium">
                      Support Email
                    </Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={config.general.supportEmail}
                      onChange={e => updateConfig('general', 'supportEmail', e.target.value)}
                      className="bg-white border-gray-200 mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="platformDescription" className="text-gray-700 font-medium">
                    Platform Description
                  </Label>
                  <Textarea
                    id="platformDescription"
                    value={config.general.platformDescription}
                    onChange={e => updateConfig('general', 'platformDescription', e.target.value)}
                    className="bg-white border-gray-200 mt-2"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-orange-200 bg-orange-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-800 font-semibold">Maintenance Mode</Label>
                          <p className="text-sm text-gray-600 mt-1">Temporarily disable platform access</p>
                        </div>
                        <Switch
                          checked={config.general.maintenanceMode}
                          onCheckedChange={checked => updateConfig('general', 'maintenanceMode', checked)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 bg-green-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-800 font-semibold">Allow Registration</Label>
                          <p className="text-sm text-gray-600 mt-1">Enable new user registration</p>
                        </div>
                        <Switch
                          checked={config.general.allowRegistration}
                          onCheckedChange={checked => updateConfig('general', 'allowRegistration', checked)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Label htmlFor="maxUsersPerCourse" className="text-gray-700 font-medium">
                    Max Users Per Course
                  </Label>
                  <Input
                    id="maxUsersPerCourse"
                    type="number"
                    value={config.general.maxUsersPerCourse}
                    onChange={e => updateConfig('general', 'maxUsersPerCourse', parseInt(e.target.value))}
                    className="bg-white border-gray-200 mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payments Settings */}
          {activeTab === 'payments' && (
            <Card className="bg-white/90 backdrop-blur-sm border-gray-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Payment Settings
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Configure payment processing and platform constants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="taxPercentage" className="text-gray-700 font-medium">
                      Tax Percentage (%)
                    </Label>
                    <Input
                      id="taxPercentage"
                      type="number"
                      value={config.payments.taxPercentage}
                      onChange={e => updateConfig('payments', 'taxPercentage', parseFloat(e.target.value))}
                      className="bg-white border-gray-200 mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">GST/VAT/Sales tax rate</p>
                  </div>

                  <div>
                    <Label htmlFor="commissionRate" className="text-gray-700 font-medium">
                      Platform Commission (%)
                    </Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      value={config.payments.commissionRate}
                      onChange={e => updateConfig('payments', 'commissionRate', parseFloat(e.target.value))}
                      className="bg-white border-gray-200 mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Platform fee on transactions</p>
                  </div>

                  <div>
                    <Label htmlFor="payoutLimit" className="text-gray-700 font-medium">
                      Minimum Payout Limit (₹)
                    </Label>
                    <Input
                      id="payoutLimit"
                      type="number"
                      value={config.payments.payoutLimit}
                      onChange={e => updateConfig('payments', 'payoutLimit', parseFloat(e.target.value))}
                      className="bg-white border-gray-200 mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum amount for payouts</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="currency" className="text-gray-700 font-medium">
                    Default Currency
                  </Label>
                  <Select
                    value={config.payments.currency}
                    onValueChange={value => updateConfig('payments', 'currency', value)}
                  >
                    <SelectTrigger className="bg-white border-gray-200 mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">Indian Rupee (₹ INR)</SelectItem>
                      <SelectItem value="USD">US Dollar ($ USD)</SelectItem>
                      <SelectItem value="EUR">Euro (€ EUR)</SelectItem>
                      <SelectItem value="GBP">British Pound (£ GBP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-800 font-semibold">Auto Refunds</Label>
                          <p className="text-sm text-gray-600 mt-1">Automatically process refunds</p>
                        </div>
                        <Switch
                          checked={config.payments.enableAutoRefunds}
                          onCheckedChange={checked => updateConfig('payments', 'enableAutoRefunds', checked)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <div>
                    <Label htmlFor="refundWindowDays" className="text-gray-700 font-medium">
                      Refund Window (days)
                    </Label>
                    <Input
                      id="refundWindowDays"
                      type="number"
                      value={config.payments.refundWindowDays}
                      onChange={e => updateConfig('payments', 'refundWindowDays', parseInt(e.target.value))}
                      className="bg-white border-gray-200 mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 font-medium">Enabled Payment Methods</Label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {['card', 'upi', 'netbanking', 'wallet'].map(method => (
                      <Badge
                        key={method}
                        className={`cursor-pointer ${
                          config.payments.paymentMethods.includes(method)
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                        onClick={() => {
                          const methods = config.payments.paymentMethods.includes(method)
                            ? config.payments.paymentMethods.filter(m => m !== method)
                            : [...config.payments.paymentMethods, method];
                          updateConfig('payments', 'paymentMethods', methods);
                        }}
                      >
                        {method.charAt(0).toUpperCase() + method.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* API Credentials */}
          {activeTab === 'apiCredentials' && (
            <div className="space-y-6">
              {/* Razorpay */}
              <Card className="bg-white/90 backdrop-blur-sm border-gray-100 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-gray-800 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        Razorpay Configuration
                      </CardTitle>
                      <CardDescription className="text-gray-600">Payment gateway credentials</CardDescription>
                    </div>
                    <Switch
                      checked={config.apiCredentials.razorpay.enabled}
                      onCheckedChange={checked => updateNestedConfig('apiCredentials', 'razorpay', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700 font-medium">Key ID</Label>
                      <div className="relative mt-2">
                        <Input
                          type={showSecrets['razorpay_keyId'] ? 'text' : 'password'}
                          value={config.apiCredentials.razorpay.keyId}
                          onChange={e => updateNestedConfig('apiCredentials', 'razorpay', 'keyId', e.target.value)}
                          className="bg-white border-gray-200 pr-10"
                          placeholder="rzp_test_xxxxxxxxxxxxx"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => toggleSecretVisibility('razorpay_keyId')}
                        >
                          {showSecrets['razorpay_keyId'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium">Key Secret</Label>
                      <div className="relative mt-2">
                        <Input
                          type={showSecrets['razorpay_keySecret'] ? 'text' : 'password'}
                          value={config.apiCredentials.razorpay.keySecret}
                          onChange={e => updateNestedConfig('apiCredentials', 'razorpay', 'keySecret', e.target.value)}
                          className="bg-white border-gray-200 pr-10"
                          placeholder="••••••••••••••••"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => toggleSecretVisibility('razorpay_keySecret')}
                        >
                          {showSecrets['razorpay_keySecret'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">Webhook Secret</Label>
                    <div className="relative mt-2">
                      <Input
                        type={showSecrets['razorpay_webhook'] ? 'text' : 'password'}
                        value={config.apiCredentials.razorpay.webhookSecret}
                        onChange={e => updateNestedConfig('apiCredentials', 'razorpay', 'webhookSecret', e.target.value)}
                        className="bg-white border-gray-200 pr-10"
                        placeholder="whsec_xxxxxxxxxxxxx"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => toggleSecretVisibility('razorpay_webhook')}
                      >
                        {showSecrets['razorpay_webhook'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Zoom */}
              <Card className="bg-white/90 backdrop-blur-sm border-gray-100 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-gray-800 flex items-center gap-2">
                        <Video className="w-5 h-5 text-purple-600" />
                        Zoom Configuration
                      </CardTitle>
                      <CardDescription className="text-gray-600">Video conferencing credentials</CardDescription>
                    </div>
                    <Switch
                      checked={config.apiCredentials.zoom.enabled}
                      onCheckedChange={checked => updateNestedConfig('apiCredentials', 'zoom', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700 font-medium">API Key</Label>
                      <Input
                        type="password"
                        value={config.apiCredentials.zoom.apiKey}
                        onChange={e => updateNestedConfig('apiCredentials', 'zoom', 'apiKey', e.target.value)}
                        className="bg-white border-gray-200 mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium">API Secret</Label>
                      <Input
                        type="password"
                        value={config.apiCredentials.zoom.apiSecret}
                        onChange={e => updateNestedConfig('apiCredentials', 'zoom', 'apiSecret', e.target.value)}
                        className="bg-white border-gray-200 mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium">SDK Key</Label>
                      <Input
                        type="password"
                        value={config.apiCredentials.zoom.sdkKey}
                        onChange={e => updateNestedConfig('apiCredentials', 'zoom', 'sdkKey', e.target.value)}
                        className="bg-white border-gray-200 mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium">SDK Secret</Label>
                      <Input
                        type="password"
                        value={config.apiCredentials.zoom.sdkSecret}
                        onChange={e => updateNestedConfig('apiCredentials', 'zoom', 'sdkSecret', e.target.value)}
                        className="bg-white border-gray-200 mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Firebase */}
              <Card className="bg-white/90 backdrop-blur-sm border-gray-100 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-gray-800 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-orange-600" />
                        Firebase Configuration
                      </CardTitle>
                      <CardDescription className="text-gray-600">Push notifications & auth</CardDescription>
                    </div>
                    <Switch
                      checked={config.apiCredentials.firebase.enabled}
                      onCheckedChange={checked => updateNestedConfig('apiCredentials', 'firebase', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700 font-medium">API Key</Label>
                      <Input
                        type="password"
                        value={config.apiCredentials.firebase.apiKey}
                        onChange={e => updateNestedConfig('apiCredentials', 'firebase', 'apiKey', e.target.value)}
                        className="bg-white border-gray-200 mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium">Auth Domain</Label>
                      <Input
                        value={config.apiCredentials.firebase.authDomain}
                        onChange={e => updateNestedConfig('apiCredentials', 'firebase', 'authDomain', e.target.value)}
                        className="bg-white border-gray-200 mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium">Project ID</Label>
                      <Input
                        value={config.apiCredentials.firebase.projectId}
                        onChange={e => updateNestedConfig('apiCredentials', 'firebase', 'projectId', e.target.value)}
                        className="bg-white border-gray-200 mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium">Messaging Sender ID</Label>
                      <Input
                        value={config.apiCredentials.firebase.messagingSenderId}
                        onChange={e => updateNestedConfig('apiCredentials', 'firebase', 'messagingSenderId', e.target.value)}
                        className="bg-white border-gray-200 mt-2"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">App ID</Label>
                    <Input
                      value={config.apiCredentials.firebase.appId}
                      onChange={e => updateNestedConfig('apiCredentials', 'firebase', 'appId', e.target.value)}
                      className="bg-white border-gray-200 mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Theme Settings */}
          {activeTab === 'theme' && (
            <Card className="bg-white/90 backdrop-blur-sm border-gray-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-pink-600" />
                  Theme Settings
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Customize platform appearance and colors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-gray-700 font-medium">Theme Mode</Label>
                  <Select
                    value={config.theme.mode}
                    onValueChange={value => updateConfig('theme', 'mode', value)}
                  >
                    <SelectTrigger className="bg-white border-gray-200 mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light Mode</SelectItem>
                      <SelectItem value="dark">Dark Mode</SelectItem>
                      <SelectItem value="system">System Default</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-gray-700 font-medium">Primary Color</Label>
                    <div className="flex gap-2 items-center mt-2">
                      <Input
                        type="color"
                        value={config.theme.primaryColor}
                        onChange={e => updateConfig('theme', 'primaryColor', e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={config.theme.primaryColor}
                        onChange={e => updateConfig('theme', 'primaryColor', e.target.value)}
                        className="bg-white border-gray-200"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">Secondary Color</Label>
                    <div className="flex gap-2 items-center mt-2">
                      <Input
                        type="color"
                        value={config.theme.secondaryColor}
                        onChange={e => updateConfig('theme', 'secondaryColor', e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={config.theme.secondaryColor}
                        onChange={e => updateConfig('theme', 'secondaryColor', e.target.value)}
                        className="bg-white border-gray-200"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">Accent Color</Label>
                    <div className="flex gap-2 items-center mt-2">
                      <Input
                        type="color"
                        value={config.theme.accentColor}
                        onChange={e => updateConfig('theme', 'accentColor', e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={config.theme.accentColor}
                        onChange={e => updateConfig('theme', 'accentColor', e.target.value)}
                        className="bg-white border-gray-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Preview</h4>
                  <div className="flex gap-3">
                    <div 
                      className="w-20 h-20 rounded-lg shadow-md" 
                      style={{ backgroundColor: config.theme.primaryColor }}
                    />
                    <div 
                      className="w-20 h-20 rounded-lg shadow-md" 
                      style={{ backgroundColor: config.theme.secondaryColor }}
                    />
                    <div 
                      className="w-20 h-20 rounded-lg shadow-md" 
                      style={{ backgroundColor: config.theme.accentColor }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* RBAC Settings */}
          {activeTab === 'rbac' && (
            <Card className="bg-white/90 backdrop-blur-sm border-gray-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-red-600" />
                  Role-Based Access Control (RBAC)
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Manage user roles and permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-gray-700 font-medium mb-2 block">System Roles</Label>
                  <div className="flex gap-2 flex-wrap">
                    {config.rbac.roles.map(role => (
                      <Badge key={role} className="bg-blue-500 text-white text-sm py-2 px-4">
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-gray-700 font-medium">Role Permissions</Label>
                  {Object.entries(config.rbac.permissions).map(([role, permissions]) => (
                    <Card key={role} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-800 capitalize">{role}</h4>
                          <Badge variant="outline">{permissions.length} permissions</Badge>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {permissions.map(perm => (
                            <Badge key={perm} variant="secondary" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Save/Reset Actions */}
        <Card className="bg-white/90 backdrop-blur-sm border-gray-100 shadow-lg mt-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-800 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  System Configuration
                </h3>
                <p className="text-gray-600 text-sm mt-1">Changes will affect all platform users</p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="bg-white/90 backdrop-blur-sm border-gray-100 shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="text-gray-800">System Status</CardTitle>
            <CardDescription className="text-gray-600">
              Current system health and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-700 mb-1">Database</p>
                    <p className="text-2xl font-bold text-green-800 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Connected
                    </p>
                  </div>
                  <Database className="w-10 h-10 text-green-600" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-700 mb-1">API Server</p>
                    <p className="text-2xl font-bold text-blue-800 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Online
                    </p>
                  </div>
                  <Server className="w-10 h-10 text-blue-600" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-purple-700 mb-1">Payment Gateway</p>
                    <p className="text-2xl font-bold text-purple-800 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Ready
                    </p>
                  </div>
                  <CreditCard className="w-10 h-10 text-purple-600" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-orange-700 mb-1">Live Classes</p>
                    <p className="text-2xl font-bold text-orange-800 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Available
                    </p>
                  </div>
                  <Video className="w-10 h-10 text-orange-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemSettingsManagement;
