"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface MissedRunDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  runDescription: string;
  runDate: string;
}

export default function MissedRunDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  runDescription, 
  runDate 
}: MissedRunDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md bg-neutral-900 border-neutral-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-white">Mark Run as Missed</CardTitle>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription className="text-gray-300">
            Are you sure you want to mark this run as missed?
          </CardDescription>
          <div className="bg-neutral-800 p-3 rounded-lg">
            <p className="text-white font-medium">{runDescription}</p>
            <p className="text-gray-400 text-sm">{runDate}</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={onConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Mark as Missed
            </Button>
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex-1 border-neutral-700 text-gray-300 hover:bg-neutral-800"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
