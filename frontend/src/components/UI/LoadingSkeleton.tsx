import { Skeleton, Box } from '@mui/material';

export const ModelGridSkeleton = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            width={120}
            height={40}
            sx={{ borderRadius: 1 }}
          />
        ))}
      </Box>
      <Skeleton variant="rectangular" width={300} height={56} sx={{ borderRadius: 1 }} />
      <Skeleton variant="rectangular" width={500} height={500} sx={{ borderRadius: 1 }} />
    </Box>
  );
};

export const CanvasLoadingSkeleton = () => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 1000,
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Skeleton
          variant="circular"
          width={80}
          height={80}
          sx={{ margin: '0 auto 16px' }}
        />
        <Skeleton variant="text" width={200} height={40} sx={{ margin: '0 auto' }} />
      </Box>
    </Box>
  );
};
