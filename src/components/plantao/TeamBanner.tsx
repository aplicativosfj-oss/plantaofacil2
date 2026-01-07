import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { motion } from 'framer-motion';

// Team banner images
import teamAlfa from '@/assets/teams/team-alfa.png';
import teamBravo from '@/assets/teams/team-bravo.png';
import teamCharlie from '@/assets/teams/team-charlie.png';
import teamDelta from '@/assets/teams/team-delta.png';

const TEAM_BANNERS: Record<string, string> = {
  alfa: teamAlfa,
  bravo: teamBravo,
  charlie: teamCharlie,
  delta: teamDelta,
};

const TeamBanner = () => {
  const { agent } = usePlantaoAuth();

  if (!agent?.current_team) {
    return null;
  }

  const bannerSrc = TEAM_BANNERS[agent.current_team];

  if (!bannerSrc) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full overflow-hidden rounded-lg"
    >
      <div className="relative aspect-[21/9] w-full">
        <img
          src={bannerSrc}
          alt={`Equipe ${agent.current_team.charAt(0).toUpperCase() + agent.current_team.slice(1)}`}
          className="w-full h-full object-cover rounded-lg"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent rounded-lg" />
      </div>
    </motion.div>
  );
};

export default TeamBanner;
