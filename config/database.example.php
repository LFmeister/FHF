<?php
// Supabase configuration - EXAMPLE FILE
// Copy this file to database.php and replace with your actual credentials
class Database {
    private $supabase_url;
    private $supabase_key;
    private $supabase_service_key;
    
    public function __construct() {
        // Replace with your Supabase credentials
        // Get these from: Supabase Dashboard → Settings → API
        $this->supabase_url = 'https://your-project-id.supabase.co';
        $this->supabase_key = 'your-anon-public-key-here';
        $this->supabase_service_key = 'your-service-role-key-here';
    }
    
    public function makeRequest($endpoint, $method = 'GET', $data = null, $useServiceKey = false) {
        $url = $this->supabase_url . '/rest/v1/' . $endpoint;
        
        $headers = [
            'Content-Type: application/json',
            'Prefer: return=representation',
            'apikey: ' . ($useServiceKey ? $this->supabase_service_key : $this->supabase_key)
        ];
        
        if (isset($_SESSION['access_token'])) {
            $headers[] = 'Authorization: Bearer ' . $_SESSION['access_token'];
        }
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        
        if ($data && in_array($method, ['POST', 'PUT', 'PATCH'])) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return [
            'data' => json_decode($response, true),
            'status' => $httpCode
        ];
    }
    
    public function auth($endpoint, $data) {
        $url = $this->supabase_url . '/auth/v1/' . $endpoint;
        
        $headers = [
            'Content-Type: application/json',
            'apikey: ' . $this->supabase_key
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return [
            'data' => json_decode($response, true),
            'status' => $httpCode
        ];
    }
    
    public function uploadFile($bucket, $path, $file) {
        $url = $this->supabase_url . '/storage/v1/object/' . $bucket . '/' . $path;
        
        $headers = [
            'Authorization: Bearer ' . $_SESSION['access_token'],
            'apikey: ' . $this->supabase_key
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $file);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return [
            'data' => json_decode($response, true),
            'status' => $httpCode
        ];
    }
}

$db = new Database();
?>
