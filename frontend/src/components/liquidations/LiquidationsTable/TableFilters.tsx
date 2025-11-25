import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SearchIcon from '@mui/icons-material/Search';

interface TableFiltersProps {
  collateralFilter: string | null;
  debtFilter: string | null;
  walletFilter: string;
  collateralAssets: string[];
  debtAssets: string[];
  onCollateralChange: (value: string | null) => void;
  onDebtChange: (value: string | null) => void;
  onWalletChange: (value: string) => void;
}

function TableFilters({
  collateralFilter,
  debtFilter,
  walletFilter,
  collateralAssets,
  debtAssets,
  onCollateralChange,
  onDebtChange,
  onWalletChange,
}: TableFiltersProps) {
  const [collateralAnchorEl, setCollateralAnchorEl] = useState<null | HTMLElement>(null);
  const [debtAnchorEl, setDebtAnchorEl] = useState<null | HTMLElement>(null);

  const pillButtonStyles = {
    borderRadius: '50px',
    padding: '10px 24px',
    textTransform: 'none' as const,
    color: '#1a1a1a',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    border: 'none',
    fontSize: '1rem',
    fontWeight: 600,
    boxShadow: 'none',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 1)',
      boxShadow: 'none',
    },
  };

  const menuStyles = {
    backgroundColor: '#071311',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    maxHeight: 300,
    marginTop: 1,
    padding: 0,
  };

  const menuItemStyles = {
    color: 'rgba(255, 255, 255, 0.87)',
    fontSize: '0.95rem',
    padding: '12px 24px',
    backgroundColor: '#111e1c',
    '&:hover': { backgroundColor: '#071311' },
    '&.Mui-selected': {
      backgroundColor: '#071311',
      color: 'rgba(255, 255, 255, 0.87)',
      '&:hover': { backgroundColor: '#071311' },
    },
  };

  return (
    <Box
      sx={{
        paddingY: 2,
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      {/* Collateral Filter */}
      <Button
        onClick={e => setCollateralAnchorEl(e.currentTarget)}
        endIcon={<KeyboardArrowDownIcon sx={{ color: 'rgba(255, 255, 255, 0.87)' }} />}
        sx={{
          ...pillButtonStyles,
          backgroundColor: '#111e1c',
          color: 'rgba(255, 255, 255, 0.87)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          '&:hover': {
            backgroundColor: '#1a2a27',
            boxShadow: 'none',
          },
        }}
      >
        Collateral asset
      </Button>
      <Menu
        anchorEl={collateralAnchorEl}
        open={Boolean(collateralAnchorEl)}
        onClose={() => setCollateralAnchorEl(null)}
        PaperProps={{ sx: menuStyles }}
      >
        <MenuItem
          onClick={() => {
            onCollateralChange(null);
            setCollateralAnchorEl(null);
          }}
          sx={menuItemStyles}
        >
          All
        </MenuItem>
        {collateralAssets.map(asset => (
          <MenuItem
            key={asset}
            onClick={() => {
              onCollateralChange(asset);
              setCollateralAnchorEl(null);
            }}
            selected={collateralFilter === asset}
            sx={menuItemStyles}
          >
            {asset}
          </MenuItem>
        ))}
      </Menu>

      {/* Debt Filter */}
      <Button
        onClick={e => setDebtAnchorEl(e.currentTarget)}
        endIcon={<KeyboardArrowDownIcon sx={{ color: 'rgba(255, 255, 255, 0.87)' }} />}
        sx={{
          ...pillButtonStyles,
          backgroundColor: '#111e1c',
          color: 'rgba(255, 255, 255, 0.87)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          '&:hover': {
            backgroundColor: '#1a2a27',
            boxShadow: 'none',
          },
        }}
      >
        Debt asset
      </Button>
      <Menu
        anchorEl={debtAnchorEl}
        open={Boolean(debtAnchorEl)}
        onClose={() => setDebtAnchorEl(null)}
        PaperProps={{ sx: menuStyles }}
      >
        <MenuItem
          onClick={() => {
            onDebtChange(null);
            setDebtAnchorEl(null);
          }}
          sx={menuItemStyles}
        >
          All
        </MenuItem>
        {debtAssets.map(asset => (
          <MenuItem
            key={asset}
            onClick={() => {
              onDebtChange(asset);
              setDebtAnchorEl(null);
            }}
            selected={debtFilter === asset}
            sx={menuItemStyles}
          >
            {asset}
          </MenuItem>
        ))}
      </Menu>

      {/* Wallet Search */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'transparent',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '50px',
          padding: '0 16px',
          width: 280,
        }}
      >
        <SearchIcon sx={{ color: '#808080', fontSize: '1.3rem', marginRight: 1 }} />
        <TextField
          size="small"
          value={walletFilter}
          onChange={e => onWalletChange(e.target.value)}
          placeholder="Search by wallet"
          variant="standard"
          InputProps={{ disableUnderline: true }}
          sx={{
            flex: 1,
            '& .MuiInputBase-input': {
              color: 'rgba(255, 255, 255, 0.87)',
              fontSize: '1rem',
              padding: '10px 0',
              '&::placeholder': { color: '#808080', opacity: 1 },
            },
          }}
        />
      </Box>
    </Box>
  );
}

export default TableFilters;
