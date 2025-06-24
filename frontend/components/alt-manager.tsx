"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, LogIn, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Account {
  id: string
  username: string
  email: string
  password: string
  isSelected: boolean
  lastUsed?: string
}

export default function AltManager() {
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: "1",
      username: "kodinovski",
      email: "kodinovski@example.com",
      password: "password123",
      isSelected: true,
    },
    {
      id: "2",
      username: "KamiSkidder",
      email: "kamiskidder@example.com",
      password: "password456",
      isSelected: false,
      lastUsed: "2023/04/14",
    },
  ])

  // Current account state that can be saved
  const [currentAccount, setCurrentAccount] = useState({
    username: "NewUser",
    email: "newuser@example.com",
    password: "password789",
  })

  const [accountName, setAccountName] = useState("")
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)

  const handleSaveCurrentAccount = () => {
    if (!accountName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an account name",
        variant: "destructive",
      })
      return
    }

    const newAccount: Account = {
      id: Date.now().toString(),
      username: accountName,
      email: currentAccount.email,
      password: currentAccount.password,
      isSelected: false,
    }

    // Check if account name already exists
    const existingIndex = accounts.findIndex((acc) => acc.username === accountName)
    if (existingIndex >= 0) {
      const updatedAccounts = [...accounts]
      updatedAccounts[existingIndex] = {
        ...updatedAccounts[existingIndex],
        ...newAccount,
        id: updatedAccounts[existingIndex].id,
      }
      setAccounts(updatedAccounts)
      toast({
        title: "Success",
        description: `Account "${accountName}" updated successfully`,
      })
    } else {
      setAccounts([...accounts, newAccount])
      toast({
        title: "Success",
        description: `Account "${accountName}" saved successfully`,
      })
    }

    setAccountName("")
    setIsSaveDialogOpen(false)
  }

  const handleDeleteAccount = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId)
    setAccounts(accounts.filter((acc) => acc.id !== accountId))

    toast({
      title: "Success",
      description: `Account "${account?.username}" deleted successfully`,
    })
  }

  const handleLogin = (accountId: string) => {
    const updatedAccounts = accounts.map((acc) => ({
      ...acc,
      isSelected: acc.id === accountId,
      lastUsed: acc.id === accountId ? new Date().toLocaleDateString("en-CA") : acc.lastUsed,
    }))

    setAccounts(updatedAccounts)

    const account = accounts.find((acc) => acc.id === accountId)

    // Update current account state when logging in
    if (account) {
      setCurrentAccount({
        username: account.username,
        email: account.email,
        password: account.password,
      })
    }

    toast({
      title: "Success",
      description: `Logged in as "${account?.username}"`,
    })
  }

  return (
    <div className="bg-gray-900 h-full overflow-auto">
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-white text-2xl font-semibold">Account Manager</h1>

            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white w-8 h-8 p-0 rounded">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Save Current Account</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Save the current account configuration with a custom name.
                  </DialogDescription>
                </DialogHeader>

                {/* Show current account details */}
                <div className="space-y-4">
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                    <h4 className="text-white font-medium mb-2">Current Account Details:</h4>
                    <div className="space-y-1 text-sm text-gray-300">
                      <p>
                        <span className="text-gray-400">Email:</span> {currentAccount.email}
                      </p>
                      <p>
                        <span className="text-gray-400">Password:</span> {"•".repeat(currentAccount.password.length)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account-name" className="text-white">
                      Account Name
                    </Label>
                    <Input
                      id="account-name"
                      placeholder="Enter account name..."
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsSaveDialogOpen(false)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveCurrentAccount} className="bg-green-600 hover:bg-green-700">
                    Save Account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Account List */}
          <div className="space-y-4">
            {accounts.map((account) => (
              <div key={account.id} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${account.isSelected ? "bg-green-500" : "bg-gray-600"}`} />
                    <div>
                      <h3 className="text-white font-medium text-lg">{account.username}</h3>
                      {account.isSelected ? (
                        <p className="text-green-500 text-sm">Currently Selected</p>
                      ) : (
                        account.lastUsed && <p className="text-gray-400 text-sm">Last used on {account.lastUsed}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      size="sm"
                      onClick={() => handleLogin(account.id)}
                      disabled={account.isSelected}
                      className="bg-transparent border border-green-500 text-green-500 hover:bg-green-500 hover:text-white px-4 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <LogIn className="h-3 w-3 mr-1" />
                      Login
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDeleteAccount(account.id)}
                      className="bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-4 py-1 text-sm"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {accounts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No accounts saved yet</p>
              <Button onClick={() => setIsSaveDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Save Your First Account
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
