import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, DollarSign } from 'lucide-react';

interface Props { onBack: () => void; }

const OvertimePanel = ({ onBack }: Props) => (
  <div className="space-y-4">
    <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" /> Banco de Horas</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Funcionalidade em desenvolvimento. Aqui você poderá registrar e acompanhar suas horas extras.</p>
      </CardContent>
    </Card>
  </div>
);

export default OvertimePanel;
