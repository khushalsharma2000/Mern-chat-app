import {
  Box,
  Container,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { useEffect } from "react";
import { useHistory } from "react-router";
import Login from "../components/Authentication/Login";
import Signup from "../components/Authentication/Signup";
import './Homepage.css';

function Homepage() {
  const history = useHistory();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userInfo"));

    if (user) history.push("/chats");
  }, [history]);

  return (
    
 <div className="background-container">
        <img id = "imgmoon" src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/1231630/moon2.png" alt="" />
        <div className="stars"></div>
        <div className="twinkling"></div>
        <div className="clouds"></div>
        <Container maxW="xl" centerContent>
       
      <Box
        d="flex"
        justifyContent="center"
        p={3}
        bg="#943126" 
        w="100%"
        m="40px 0 15px 0"
        borderRadius="lg"
        borderWidth="1px"
        
      >
          
      
        <Text fontSize="4xl" fontFamily="Work sans" >
          Khushal-Chat-Application
        </Text>
      </Box>
      <Box bg="#943126" w="100%" p={4} borderRadius="lg" borderWidth="1px">
        <Tabs isFitted variant="soft-rounded">
          <TabList mb="1em">
            <Tab>Login</Tab>
            <Tab>Sign Up</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Login />
            </TabPanel>
            <TabPanel>
              <Signup />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
      /</Container>
      </div>
  );
}

export default Homepage;
