'use client';

import * as React from 'react';
import {
  Bot,
  Sparkles,
  Brain,
  BookOpen,
  Calculator,
  Palette,
  Upload,
  X,
} from 'lucide-react';
import { db } from '@/lib/instant';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';

export interface CustomAgent {
  id: string;
  name: string;
  icon: string;
  personality: string;
  expertise: string;
  systemPrompt: string;
  color: string;
  avatarUrl?: string;
  starterPrompts?: string[];
}

interface CreateAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateAgent: (agent: CustomAgent) => void;
}

const AVATAR_OPTIONS = [
  { value: 'bot', label: 'Robot', icon: Bot },
  { value: 'sparkles', label: 'Sparkles', icon: Sparkles },
  { value: 'brain', label: 'Brain', icon: Brain },
  { value: 'book', label: 'Book', icon: BookOpen },
  { value: 'calculator', label: 'Calculator', icon: Calculator },
  { value: 'palette', label: 'Palette', icon: Palette },
];

const COLOR_OPTIONS = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
  { value: 'teal', label: 'Teal', class: 'bg-teal-500' },
];

export function CreateAgentModal({
  open,
  onOpenChange,
  onCreateAgent,
}: CreateAgentModalProps) {
  const [name, setName] = React.useState('');
  const [icon, setIcon] = React.useState('bot');
  const [personality, setPersonality] = React.useState('');
  const [expertise, setExpertise] = React.useState('');
  const [systemPrompt, setSystemPrompt] = React.useState('');
  const [color, setColor] = React.useState('blue');
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [starterPrompts, setStarterPrompts] = React.useState<string[]>(['', '', '']);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }
      
      setAvatarFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      let avatarUrl: string | undefined;
      
      if (avatarFile) {
        // Upload avatar using server-side API (bypasses permissions)
        const agentId = `custom-${Date.now()}`;
        const formData = new FormData();
        formData.append('file', avatarFile);
        formData.append('agentId', agentId);
        
        const uploadResponse = await fetch('/api/upload/avatar', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Upload failed');
        }
        
        const uploadResult = await uploadResponse.json();
        avatarUrl = uploadResult.fileId;
      }
      
      const newAgent: CustomAgent = {
        id: `custom-${Date.now()}`,
        name: name.trim(),
        icon,
        personality: personality.trim(),
        expertise: expertise.trim(),
        systemPrompt: systemPrompt.trim(),
        color,
        avatarUrl,
        starterPrompts: starterPrompts.filter(p => p.trim()).map(p => p.trim()),
      };

      onCreateAgent(newAgent);
      
      // Reset form
      setName('');
      setIcon('bot');
      setPersonality('');
      setExpertise('');
      setSystemPrompt('');
      setColor('blue');
      setAvatarFile(null);
      setAvatarPreview(null);
      setStarterPrompts(['', '', '']);
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating agent:', error);
      alert(`Failed to create agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const selectedIcon = AVATAR_OPTIONS.find((opt) => opt.value === icon);
  const IconComponent = selectedIcon?.icon || Bot;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Agent</DialogTitle>
          <DialogDescription>
            Design your own AI agent with a unique personality and expertise.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Agent Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Science Tutor, Creative Writer, Code Helper"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Avatar Upload */}
            <div className="space-y-2">
              <Label>Custom Avatar (Optional)</Label>
              <div className="flex flex-col gap-3">
                {avatarPreview ? (
                  <div className="relative w-24 h-24">
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full rounded-full object-cover border-2 border-border"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-full border-2 border-dashed border-border hover:border-primary flex items-center justify-center bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">
                  Upload a custom avatar image (max 5MB). Uses fallback icon if none uploaded.
                </p>
              </div>
            </div>

            {/* Avatar Icon Fallback */}
            <div className="space-y-2">
              <Label>Fallback Icon</Label>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setIcon(option.value)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all hover:bg-accent ${
                        icon === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-xs mt-1">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Selection */}
            <div className="space-y-2">
              <Label>Theme Color</Label>
              <div className="grid grid-cols-6 gap-2">
                {COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setColor(option.value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      color === option.value
                        ? 'border-primary'
                        : 'border-border'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${option.class}`} />
                    <span className="text-xs mt-1">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Expertise */}
            <div className="space-y-2">
              <Label htmlFor="expertise">Area of Expertise *</Label>
              <Input
                id="expertise"
                placeholder="e.g., Biology, Creative Writing, Python Programming"
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                required
              />
            </div>

            {/* Personality */}
            <div className="space-y-2">
              <Label htmlFor="personality">Personality Traits</Label>
              <Textarea
                id="personality"
                placeholder="e.g., Friendly, patient, uses analogies to explain concepts, encouraging"
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Describe how the agent should interact with users
              </p>
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <Label htmlFor="systemPrompt">
                Custom Instructions (Optional)
              </Label>
              <Textarea
                id="systemPrompt"
                placeholder="e.g., You are an expert biology tutor who specializes in making complex topics accessible..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Advanced: Provide specific instructions for the AI agent
              </p>
            </div>

            {/* Starter Prompts */}
            <div className="space-y-2">
              <Label>Starter Prompts (Optional)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Suggest conversation starters for users (up to 3)
              </p>
              {starterPrompts.map((prompt, index) => (
                <Input
                  key={index}
                  placeholder={`e.g., ${index === 0 ? 'Explain photosynthesis simply' : index === 1 ? 'What are the main types of cells?' : 'Help me with cellular respiration'}`}
                  value={prompt}
                  onChange={(e) => {
                    const newPrompts = [...starterPrompts];
                    newPrompts[index] = e.target.value;
                    setStarterPrompts(newPrompts);
                  }}
                  className="mb-2"
                />
              ))}
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${color}-500/10`}
                  >
                    <IconComponent className={`w-6 h-6 text-${color}-600`} />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium">{name || 'Agent Name'}</p>
                  <p className="text-sm text-muted-foreground">
                    {expertise || 'Area of expertise'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || !expertise.trim() || isUploading}
            >
              {isUploading ? 'Creating...' : 'Create Agent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
