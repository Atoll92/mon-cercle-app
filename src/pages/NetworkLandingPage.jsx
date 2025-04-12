import React from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from '../supabaseclient';
import { Avatar, Box, Button, Container, Grid, Paper, Typography } from "@mui/material";
import { fetchNetworkMembers } from "../api/networks";

const NetworkLandingPage = () => {

    const { networkId } = useParams();
    const [network, setNetwork] = React.useState(null);
    const [networkMembers, setNetworkMembers] = React.useState(null);

    React.useEffect(() => {
        //get the network object from supabase
        const fetchNetwork = async () => {
            const { data, error } = await supabase
                .from('networks')
                .select('*')
                .eq('id', networkId)
                .single();

            if (error) {
                console.error('Error fetching network:', error);
            } else {
                console.log('Network data:', data);
                setNetwork(data);
            }
        };

        if (networkId) {
            fetchNetwork();
            fetchNetworkMembers(networkId)
                .then(members => {
                    setNetworkMembers(members);
                    console.log('Network members:', members);
                })
        }
    }, [networkId]);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 2 }}>
                {network ? (
                    <div>
                        <Typography variant="h1" gutterBottom>{network.name}</Typography>
                        <Typography variant="body1" gutterBottom>{network.description}</Typography>
                        <Typography variant="h6" gutterBottom>Network members :</Typography>

                        {networkMembers && networkMembers.length > 0 ? (
                            <Grid container spacing={2}>
                                {networkMembers.map(member => (
                                    <Box key={member.id} sx={{ p: 2, border: '1px solid #ccc', borderRadius: '4px', mb: 2, textAlign: 'center' }}>
                                        <Avatar
                                            alt={member.full_name}
                                            src={member.profile_picture_url}
                                            sx={{ width: 56, height: 56, mb: 2, mx: 'auto' }}
                                        />
                                        <Typography variant="body1">{member.full_name}</Typography>
                                        <Typography variant="body2" color="textSecondary">{member.role}</Typography>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            sx={{ mt: 2 }}
                                            to={`/profile/${member.id}`}
                                            component={Link}
                                        >
                                            View Profile  
                                        </Button>
                                    </Box>
                                ))}
                            </Grid>
                        ) : (
                            <Typography variant="body1">No members found for this network.</Typography>
                        )}
                    </div>
                ) : (
                    <Typography variant="body1">Loading network details...</Typography>
                )}
            </Paper>
        </Container>
  );
}

export default NetworkLandingPage;