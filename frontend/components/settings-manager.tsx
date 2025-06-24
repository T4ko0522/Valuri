"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Save, Upload, Download, Trash2, Settings, FolderOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SettingsProfile {
  name: string
  theme: string
  language: string
  autoStart: boolean
  notifications: boolean
  customSettings: string
}

export default function SettingsManager() {
  const { toast } = useToast()
  const [profiles, setProfiles] = useState<SettingsProfile[]>([
    {
      name: "Default",
      theme: "dark",
      language: "en",
      autoStart: true,
      notifications: true,
      customSettings: "Default desktop application settings",
    },
  ])

  const [currentProfile, setCurrentProfile] = useState<SettingsProfile>({
    name: "",
    theme: "dark",
    language: "en",
    autoStart: false,
    notifications: true,
    customSettings: "",
  })

  const [profileName, setProfileName] = useState("")
  const [selectedProfile, setSelectedProfile] = useState("")

  const handleSaveProfile = () => {
    if (!profileName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a profile name",
        variant: "destructive",
      })
      return
    }

    const newProfile = {
      ...currentProfile,
      name: profileName,
    }

    const existingIndex = profiles.findIndex((p) => p.name === profileName)
    if (existingIndex >= 0) {
      const updatedProfiles = [...profiles]
      updatedProfiles[existingIndex] = newProfile
      setProfiles(updatedProfiles)
      toast({
        title: "Success",
        description: `Profile "${profileName}" updated successfully`,
      })
    } else {
      setProfiles([...profiles, newProfile])
      toast({
        title: "Success",
        description: `Profile "${profileName}" saved successfully`,
      })
    }

    setProfileName("")
  }

  const handleLoadProfile = () => {
    if (!selectedProfile) {
      toast({
        title: "Error",
        description: "Please select a profile to load",
        variant: "destructive",
      })
      return
    }

    const profile = profiles.find((p) => p.name === selectedProfile)
    if (profile) {
      setCurrentProfile(profile)
      toast({
        title: "Success",
        description: `Profile "${selectedProfile}" loaded successfully`,
      })
    }
  }

  const handleDeleteProfile = () => {
    if (!selectedProfile || selectedProfile === "Default") {
      toast({
        title: "Error",
        description: "Cannot delete the default profile",
        variant: "destructive",
      })
      return
    }

    setProfiles(profiles.filter((p) => p.name !== selectedProfile))
    setSelectedProfile("")
    toast({
      title: "Success",
      description: `Profile "${selectedProfile}" deleted successfully`,
    })
  }

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(profiles, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "settings-profiles.json"
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: "Settings exported successfully",
    })
  }

  return (
    <div className="bg-gray-900 h-full overflow-auto">
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-white text-2xl font-semibold mb-2">Settings Manager</h1>
            <p className="text-gray-400">Configure and manage your application settings</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Settings */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="h-5 w-5" />
                  Current Settings
                </CardTitle>
                <CardDescription className="text-gray-400">Configure your current application settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme" className="text-white">
                    Theme
                  </Label>
                  <Select
                    value={currentProfile.theme}
                    onValueChange={(value) => setCurrentProfile({ ...currentProfile, theme: value })}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="light" className="text-white hover:bg-gray-600">
                        Light
                      </SelectItem>
                      <SelectItem value="dark" className="text-white hover:bg-gray-600">
                        Dark
                      </SelectItem>
                      <SelectItem value="auto" className="text-white hover:bg-gray-600">
                        Auto
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language" className="text-white">
                    Language
                  </Label>
                  <Select
                    value={currentProfile.language}
                    onValueChange={(value) => setCurrentProfile({ ...currentProfile, language: value })}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="en" className="text-white hover:bg-gray-600">
                        English
                      </SelectItem>
                      <SelectItem value="es" className="text-white hover:bg-gray-600">
                        Spanish
                      </SelectItem>
                      <SelectItem value="fr" className="text-white hover:bg-gray-600">
                        French
                      </SelectItem>
                      <SelectItem value="de" className="text-white hover:bg-gray-600">
                        German
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-settings" className="text-white">
                    Custom Settings
                  </Label>
                  <Textarea
                    id="custom-settings"
                    placeholder="Enter custom configuration..."
                    value={currentProfile.customSettings}
                    onChange={(e) => setCurrentProfile({ ...currentProfile, customSettings: e.target.value })}
                    className="min-h-[100px] bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Profile Management */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <FolderOpen className="h-5 w-5" />
                  Profile Management
                </CardTitle>
                <CardDescription className="text-gray-400">Save, load, and manage setting profiles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Save Profile */}
                <div className="space-y-3">
                  <Label htmlFor="profile-name" className="text-white">
                    Save Current Settings
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="profile-name"
                      placeholder="Enter profile name..."
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    />
                    <Button onClick={handleSaveProfile} className="shrink-0 bg-blue-600 hover:bg-blue-700">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>

                <Separator className="bg-gray-600" />

                {/* Load Profile */}
                <div className="space-y-3">
                  <Label className="text-white">Load Existing Profile</Label>
                  <div className="flex gap-2">
                    <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select profile to load" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {profiles.map((profile) => (
                          <SelectItem key={profile.name} value={profile.name} className="text-white hover:bg-gray-600">
                            {profile.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleLoadProfile}
                      variant="outline"
                      className="shrink-0 border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Load
                    </Button>
                  </div>
                </div>

                <Separator className="bg-gray-600" />

                {/* Profile Actions */}
                <div className="flex gap-2">
                  <Button onClick={handleDeleteProfile} variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Profile
                  </Button>
                  <Button
                    onClick={handleExportSettings}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export All
                  </Button>
                </div>

                {/* Saved Profiles List */}
                <div className="space-y-2">
                  <Label className="text-white">Saved Profiles ({profiles.length})</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {profiles.map((profile) => (
                      <div
                        key={profile.name}
                        className="text-sm p-2 bg-gray-700 rounded border border-gray-600 text-gray-300"
                      >
                        {profile.name}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
