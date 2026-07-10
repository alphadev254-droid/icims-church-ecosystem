import { useParams } from 'react-router-dom';
import { PublicQrCheckIn } from '@/components/attendance/PublicQrCheckIn';

export default function PublicQrCheckInPage() {
  const { token = '' } = useParams();

  return <PublicQrCheckIn token={token} />;
}
