import { Fuel, Leaf, Zap } from 'lucide-react';
import { getMotorisation } from '../../constants/simulation';
import styles from './BadgeMotorisation.module.css';

const ICONES = {
  essence: Fuel,
  diesel: Fuel,
  hybride: Leaf,
  electrique: Zap,
};

/** Pastille de motorisation — l'information la plus structurante d'un véhicule. */
export default function BadgeMotorisation({ motorisation, taille = 'normal' }) {
  const Icone = ICONES[motorisation] ?? Fuel;
  const { label } = getMotorisation(motorisation);

  return (
    <span className={`${styles.badge} ${styles[motorisation] ?? ''} ${styles[taille]}`}>
      <Icone size={taille === 'petit' ? 11 : 13} strokeWidth={1.9} aria-hidden="true" />
      {label}
    </span>
  );
}
