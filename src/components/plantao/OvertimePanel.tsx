import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, DollarSign } from 'lucide-react';
import plantaoLogo from '@/assets/plantao-logo.png';

interface Props { onBack: () => void; }

const OvertimePanel = ({ onBack }: Props) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
      <img src={plantaoLogo} alt="PlantãoPro" className="h-8 w-auto object-contain opacity-70" />
    </div>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-accent" /> Banco de Horas</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Funcionalidade em desenvolvimento. Aqui você poderá registrar e acompanhar suas horas extras.</p>
      </CardContent>
    </Card>
    <p className="text-center text-xs text-muted-foreground">Developed by Franc Denis</p>
  </div>
);

export default OvertimePanel;
