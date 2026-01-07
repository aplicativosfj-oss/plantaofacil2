import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Bell } from 'lucide-react';

interface Props { onBack: () => void; }

const AlertsPanel = ({ onBack }: Props) => (
  <div className="space-y-4">
    <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" /> Alertas</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Nenhum alerta no momento.</p>
      </CardContent>
    </Card>
  </div>
);

export default AlertsPanel;
