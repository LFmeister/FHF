<?php
// Supabase configuration
class Database {
    private $supabase_url;
    private $supabase_key;
    private $supabase_service_key;
    
    public function __construct() {
        // Replace with your Supabase credentials
        // Example: $this->supabase_url = 'https://abcdefgh.supabase.co';
        $this->supabase_url = 'https://kcmkengwgdfehsestwve.supabase.co';
        $this->supabase_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjbWtlbmd3Z2RmZWhzZXN0d3ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMzI1NTksImV4cCI6MjA3MjgwODU1OX0.Kh6mtZHjBxA3_vI7uuci6VBhYUHbs-a4esUnxaAbXs0';
        $this->supabase_service_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjbWtlbmd3Z2RmZWhzZXN0d3ZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzIzMjU1OSwiZXhwIjoyMDcyODA4NTU5fQ.tMTAYar8C80d37B4zZ9t-kLipE4HvQula1RQaEZ1YPE';
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
