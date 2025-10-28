import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Video,
  CheckCircle,
  AlertTriangle,
  Plus
} from "lucide-react";

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  type: 'consultation' | 'follow_up' | 'emergency' | 'routine';
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  contactMethod: 'in_person' | 'phone' | 'video';
  duration: number;
  notes?: string;
}

interface TodayAppointmentsProps {
  clinic?: any;
}

export default function TodayAppointments({ clinic }: TodayAppointmentsProps) {
  const [appointments] = useState<Appointment[]>([
    {
      id: '1',
      patientName: 'Sarah Johnson',
      time: '09:30',
      type: 'consultation',
      status: 'confirmed',
      contactMethod: 'in_person',
      duration: 30,
      notes: 'First visit - general checkup'
    },
    {
      id: '2',
      patientName: 'Michael Brown',
      time: '10:15',
      type: 'follow_up',
      status: 'confirmed',
      contactMethod: 'phone',
      duration: 15,
      notes: 'Blood pressure follow-up'
    },
    {
      id: '3',
      patientName: 'Emma Wilson',
      time: '11:00',
      type: 'routine',
      status: 'pending',
      contactMethod: 'video',
      duration: 20,
      notes: 'Prescription review'
    },
    {
      id: '4',
      patientName: 'David Lee',
      time: '14:30',
      type: 'consultation',
      status: 'confirmed',
      contactMethod: 'in_person',
      duration: 45,
      notes: 'Specialist referral discussion'
    },
    {
      id: '5',
      patientName: 'Lisa Taylor',
      time: '15:45',
      type: 'emergency',
      status: 'confirmed',
      contactMethod: 'in_person',
      duration: 30,
      notes: 'Urgent - chest pain evaluation'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'bg-red-500';
      case 'consultation': return 'bg-blue-500';
      case 'follow_up': return 'bg-green-500';
      case 'routine': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getContactIcon = (method: string) => {
    switch (method) {
      case 'phone': return Phone;
      case 'video': return Video;
      case 'in_person': return User;
      default: return User;
    }
  };

  const formatTime = (time: string) => {
    return time;
  };

  const upcomingAppointments = appointments.filter(apt => 
    apt.status !== 'completed' && apt.status !== 'cancelled'
  );

  const nextAppointment = upcomingAppointments[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Today's Appointments
            <Badge variant="secondary" className="ml-2">
              {upcomingAppointments.length}
            </Badge>
          </div>
          <Button size="sm" variant="outline" data-testid="add-appointment">
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingAppointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No appointments scheduled for today</p>
            <p className="text-sm">Your schedule is clear!</p>
          </div>
        ) : (
          <>
            {/* Next Appointment Highlight */}
            {nextAppointment && (
              <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-primary">Next Appointment</h4>
                  <Badge variant="default">In Progress</Badge>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getTypeColor(nextAppointment.type)}`}></div>
                  <div className="flex-1">
                    <p className="font-medium">{nextAppointment.patientName}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(nextAppointment.time)}
                      </span>
                      <span className="flex items-center">
                        {(() => {
                          const ContactIcon = getContactIcon(nextAppointment.contactMethod);
                          return <ContactIcon className="h-3 w-3 mr-1" />;
                        })()}
                        {nextAppointment.contactMethod.replace('_', ' ')}
                      </span>
                      <span>{nextAppointment.duration}min</span>
                    </div>
                  </div>
                </div>
                {nextAppointment.notes && (
                  <p className="text-sm text-gray-600 mt-2 italic">
                    {nextAppointment.notes}
                  </p>
                )}
              </div>
            )}

            {/* Appointments List */}
            <div className="space-y-3">
              {upcomingAppointments.slice(1).map((appointment) => {
                const ContactIcon = getContactIcon(appointment.contactMethod);
                return (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getTypeColor(appointment.type)}`}></div>
                      <div>
                        <p className="font-medium">{appointment.patientName}</p>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(appointment.time)}
                          </span>
                          <span className="flex items-center">
                            <ContactIcon className="h-3 w-3 mr-1" />
                            {appointment.contactMethod.replace('_', ' ')}
                          </span>
                          <span>{appointment.duration}min</span>
                        </div>
                        {appointment.notes && (
                          <p className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                      {appointment.type === 'emergency' && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Stats */}
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="font-medium text-blue-600">{appointments.filter(a => a.status === 'confirmed').length}</p>
                  <p className="text-gray-600">Confirmed</p>
                </div>
                <div>
                  <p className="font-medium text-yellow-600">{appointments.filter(a => a.status === 'pending').length}</p>
                  <p className="text-gray-600">Pending</p>
                </div>
                <div>
                  <p className="font-medium text-green-600">
                    {appointments.reduce((sum, apt) => sum + apt.duration, 0)}min
                  </p>
                  <p className="text-gray-600">Total Time</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}