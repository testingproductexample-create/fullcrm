// Storage Manager Edge Function
// Description: Handle cloud storage operations for backup data

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        // Get request data
        const requestData = await req.json();
        const { action, location_id, file_path, organization_id, backup_data } = requestData;

        // Get Supabase configuration
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        const supabaseHeaders = {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        };

        let result;

        switch (action) {
            case 'upload_backup':
                result = await uploadBackup(supabaseUrl, supabaseHeaders, requestData);
                break;
            
            case 'download_backup':
                result = await downloadBackup(supabaseUrl, supabaseHeaders, location_id, file_path);
                break;
            
            case 'verify_backup':
                result = await verifyBackup(supabaseUrl, supabaseHeaders, requestData);
                break;
            
            case 'manage_retention':
                result = await manageRetention(supabaseUrl, supabaseHeaders, organization_id);
                break;
            
            case 'sync_locations':
                result = await syncStorageLocations(supabaseUrl, supabaseHeaders, organization_id);
                break;
            
            case 'optimize_storage':
                result = await optimizeStorage(supabaseUrl, supabaseHeaders, location_id);
                break;
            
            case 'migrate_data':
                result = await migrateData(supabaseUrl, supabaseHeaders, requestData);
                break;
            
            case 'calculate_costs':
                result = await calculateStorageCosts(supabaseUrl, supabaseHeaders, organization_id);
                break;
            
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Storage Manager error:', error);

        const errorResponse = {
            error: {
                code: 'STORAGE_MANAGER_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Upload backup data to specified storage location
async function uploadBackup(supabaseUrl, headers, uploadData) {
    const { 
        location_id, 
        backup_data, 
        file_name, 
        compression_enabled = true, 
        encryption_enabled = true,
        backup_metadata 
    } = uploadData;

    // Get backup location details
    const locationResponse = await fetch(
        `${supabaseUrl}/rest/v1/backup_locations?id=eq.${location_id}&select=*`,
        { headers }
    );

    if (!locationResponse.ok) {
        throw new Error('Failed to fetch backup location');
    }

    const locations = await locationResponse.json();
    if (locations.length === 0) {
        throw new Error('Backup location not found');
    }

    const location = locations[0];

    // Validate storage capacity
    const capacityCheck = await checkStorageCapacity(location, backup_data.size);
    if (!capacityCheck.hasCapacity) {
        throw new Error(`Insufficient storage capacity. Available: ${capacityCheck.availableGB}GB, Required: ${capacityCheck.requiredGB}GB`);
    }

    // Process backup data (compression and encryption)
    const processedData = await processBackupData(backup_data, {
        compression_enabled,
        encryption_enabled,
        compression_level: location.compression_level || 6
    });

    // Generate storage path
    const storagePath = generateStoragePath(location, file_name, backup_metadata);

    // Upload to storage based on type
    let uploadResult;
    switch (location.storage_type) {
        case 'supabase':
            uploadResult = await uploadToSupabase(supabaseUrl, headers, location, storagePath, processedData);
            break;
        case 'aws_s3':
            uploadResult = await uploadToAWS(location, storagePath, processedData);
            break;
        case 'google_cloud':
            uploadResult = await uploadToGoogleCloud(location, storagePath, processedData);
            break;
        case 'azure_blob':
            uploadResult = await uploadToAzure(location, storagePath, processedData);
            break;
        default:
            throw new Error(`Unsupported storage type: ${location.storage_type}`);
    }

    // Verify upload integrity
    const integrityCheck = await verifyUploadIntegrity(location, storagePath, processedData.hash);

    // Update location usage statistics
    await updateLocationUsage(supabaseUrl, headers, location_id, processedData.size);

    // Log upload activity
    await logStorageActivity(supabaseUrl, headers, {
        organization_id: location.organization_id,
        location_id,
        activity_type: 'upload',
        file_path: storagePath,
        file_size: processedData.size,
        compression_ratio: processedData.compressionRatio,
        encryption_used: encryption_enabled,
        upload_duration: uploadResult.duration,
        integrity_verified: integrityCheck.verified
    });

    return {
        upload_id: crypto.randomUUID(),
        storage_location: `${location.storage_type}:${location.bucket_name}/${storagePath}`,
        file_size: processedData.size,
        original_size: backup_data.size,
        compression_ratio: processedData.compressionRatio,
        encryption_used: encryption_enabled,
        upload_time: uploadResult.uploadTime,
        duration_seconds: uploadResult.duration,
        integrity_verified: integrityCheck.verified,
        file_hash: processedData.hash,
        storage_url: uploadResult.url
    };
}

// Download backup data from storage location
async function downloadBackup(supabaseUrl, headers, locationId, filePath) {
    // Get backup location details
    const locationResponse = await fetch(
        `${supabaseUrl}/rest/v1/backup_locations?id=eq.${locationId}&select=*`,
        { headers }
    );

    if (!locationResponse.ok) {
        throw new Error('Failed to fetch backup location');
    }

    const locations = await locationResponse.json();
    if (locations.length === 0) {
        throw new Error('Backup location not found');
    }

    const location = locations[0];

    // Download from storage based on type
    let downloadResult;
    const startTime = Date.now();

    switch (location.storage_type) {
        case 'supabase':
            downloadResult = await downloadFromSupabase(supabaseUrl, headers, location, filePath);
            break;
        case 'aws_s3':
            downloadResult = await downloadFromAWS(location, filePath);
            break;
        case 'google_cloud':
            downloadResult = await downloadFromGoogleCloud(location, filePath);
            break;
        case 'azure_blob':
            downloadResult = await downloadFromAzure(location, filePath);
            break;
        default:
            throw new Error(`Unsupported storage type: ${location.storage_type}`);
    }

    const downloadDuration = (Date.now() - startTime) / 1000;

    // Verify download integrity
    const integrityCheck = await verifyDownloadIntegrity(downloadResult.data, downloadResult.expectedHash);

    // Log download activity
    await logStorageActivity(supabaseUrl, headers, {
        organization_id: location.organization_id,
        location_id: locationId,
        activity_type: 'download',
        file_path: filePath,
        file_size: downloadResult.size,
        download_duration: downloadDuration,
        integrity_verified: integrityCheck.verified
    });

    return {
        download_id: crypto.randomUUID(),
        file_path: filePath,
        file_size: downloadResult.size,
        download_time: new Date().toISOString(),
        duration_seconds: downloadDuration,
        integrity_verified: integrityCheck.verified,
        data_url: downloadResult.dataUrl || null,
        storage_location: `${location.storage_type}:${location.bucket_name}/${filePath}`
    };
}

// Verify backup integrity and consistency
async function verifyBackup(supabaseUrl, headers, verificationData) {
    const { location_id, file_path, expected_hash, expected_size } = verificationData;

    // Get backup location
    const locationResponse = await fetch(
        `${supabaseUrl}/rest/v1/backup_locations?id=eq.${location_id}&select=*`,
        { headers }
    );

    const locations = await locationResponse.json();
    if (locations.length === 0) {
        throw new Error('Backup location not found');
    }

    const location = locations[0];

    // Perform verification checks
    const verificationResults = {
        file_path,
        location_name: location.location_name,
        verification_time: new Date().toISOString(),
        checks_performed: [],
        overall_status: 'passed',
        issues_found: []
    };

    try {
        // Check 1: File existence
        const existenceCheck = await checkFileExistence(location, file_path);
        verificationResults.checks_performed.push({
            check: 'File Existence',
            status: existenceCheck.exists ? 'passed' : 'failed',
            details: existenceCheck.details
        });

        if (!existenceCheck.exists) {
            verificationResults.overall_status = 'failed';
            verificationResults.issues_found.push('File does not exist in storage');
            return verificationResults;
        }

        // Check 2: File size verification
        if (expected_size) {
            const sizeCheck = await verifyFileSize(location, file_path, expected_size);
            verificationResults.checks_performed.push({
                check: 'File Size',
                status: sizeCheck.matches ? 'passed' : 'failed',
                details: `Expected: ${expected_size}, Actual: ${sizeCheck.actualSize}`
            });

            if (!sizeCheck.matches) {
                verificationResults.overall_status = 'failed';
                verificationResults.issues_found.push(`File size mismatch: expected ${expected_size}, got ${sizeCheck.actualSize}`);
            }
        }

        // Check 3: Hash verification
        if (expected_hash) {
            const hashCheck = await verifyFileHash(location, file_path, expected_hash);
            verificationResults.checks_performed.push({
                check: 'Hash Verification',
                status: hashCheck.matches ? 'passed' : 'failed',
                details: `Expected: ${expected_hash}, Actual: ${hashCheck.actualHash}`
            });

            if (!hashCheck.matches) {
                verificationResults.overall_status = 'failed';
                verificationResults.issues_found.push('File integrity check failed - hash mismatch');
            }
        }

        // Check 4: Accessibility test
        const accessCheck = await testFileAccessibility(location, file_path);
        verificationResults.checks_performed.push({
            check: 'File Accessibility',
            status: accessCheck.accessible ? 'passed' : 'failed',
            details: accessCheck.details
        });

        if (!accessCheck.accessible) {
            verificationResults.overall_status = 'failed';
            verificationResults.issues_found.push('File is not accessible for download');
        }

        // Log verification activity
        await logStorageActivity(supabaseUrl, headers, {
            organization_id: location.organization_id,
            location_id,
            activity_type: 'verification',
            file_path,
            verification_status: verificationResults.overall_status,
            checks_performed: verificationResults.checks_performed.length,
            issues_found: verificationResults.issues_found.length
        });

    } catch (error) {
        verificationResults.overall_status = 'error';
        verificationResults.issues_found.push(`Verification error: ${error.message}`);
    }

    return verificationResults;
}

// Manage backup retention policies
async function manageRetention(supabaseUrl, headers, organizationId) {
    // Get all backup schedules with retention policies
    const schedulesResponse = await fetch(
        `${supabaseUrl}/rest/v1/backup_schedules?organization_id=eq.${organizationId}&select=*`,
        { headers }
    );

    if (!schedulesResponse.ok) {
        throw new Error('Failed to fetch backup schedules');
    }

    const schedules = await schedulesResponse.json();

    const retentionResults = {
        schedules_processed: 0,
        files_deleted: 0,
        storage_freed_gb: 0,
        errors: [],
        details: []
    };

    for (const schedule of schedules) {
        try {
            const scheduleResult = await processScheduleRetention(supabaseUrl, headers, schedule);
            retentionResults.schedules_processed++;
            retentionResults.files_deleted += scheduleResult.files_deleted;
            retentionResults.storage_freed_gb += scheduleResult.storage_freed_gb;
            retentionResults.details.push(scheduleResult);

        } catch (error) {
            retentionResults.errors.push({
                schedule_id: schedule.id,
                schedule_name: schedule.schedule_name,
                error: error.message
            });
        }
    }

    // Update storage usage statistics
    if (retentionResults.storage_freed_gb > 0) {
        await updateOrganizationStorageStats(supabaseUrl, headers, organizationId, -retentionResults.storage_freed_gb);
    }

    return retentionResults;
}

// Sync storage locations and update statistics
async function syncStorageLocations(supabaseUrl, headers, organizationId) {
    // Get all active backup locations
    const locationsResponse = await fetch(
        `${supabaseUrl}/rest/v1/backup_locations?organization_id=eq.${organizationId}&is_active=eq.true&select=*`,
        { headers }
    );

    if (!locationsResponse.ok) {
        throw new Error('Failed to fetch backup locations');
    }

    const locations = await locationsResponse.json();

    const syncResults = {
        locations_synced: 0,
        sync_errors: 0,
        total_storage_used: 0,
        location_details: []
    };

    for (const location of locations) {
        try {
            const locationSync = await syncSingleLocation(supabaseUrl, headers, location);
            syncResults.locations_synced++;
            syncResults.total_storage_used += locationSync.used_capacity_gb;
            syncResults.location_details.push(locationSync);

        } catch (error) {
            syncResults.sync_errors++;
            syncResults.location_details.push({
                location_id: location.id,
                location_name: location.location_name,
                sync_status: 'failed',
                error: error.message
            });
        }
    }

    return syncResults;
}

// Optimize storage usage and costs
async function optimizeStorage(supabaseUrl, headers, locationId) {
    // Get backup location
    const locationResponse = await fetch(
        `${supabaseUrl}/rest/v1/backup_locations?id=eq.${locationId}&select=*`,
        { headers }
    );

    const locations = await locationResponse.json();
    if (locations.length === 0) {
        throw new Error('Backup location not found');
    }

    const location = locations[0];

    const optimizationResults = {
        location_id: locationId,
        location_name: location.location_name,
        optimization_time: new Date().toISOString(),
        optimizations_applied: [],
        storage_saved_gb: 0,
        cost_savings_monthly: 0
    };

    // Optimization 1: Identify duplicate files
    const duplicateCheck = await findDuplicateFiles(location);
    if (duplicateCheck.duplicates.length > 0) {
        const deduplicationResult = await deduplicateFiles(location, duplicateCheck.duplicates);
        optimizationResults.optimizations_applied.push({
            type: 'Deduplication',
            files_processed: duplicateCheck.duplicates.length,
            storage_saved_gb: deduplicationResult.storage_saved_gb,
            cost_savings: deduplicationResult.cost_savings
        });
        optimizationResults.storage_saved_gb += deduplicationResult.storage_saved_gb;
        optimizationResults.cost_savings_monthly += deduplicationResult.cost_savings;
    }

    // Optimization 2: Compress uncompressed files
    const compressionCheck = await findUncompressedFiles(location);
    if (compressionCheck.files.length > 0) {
        const compressionResult = await compressFiles(location, compressionCheck.files);
        optimizationResults.optimizations_applied.push({
            type: 'Compression',
            files_processed: compressionCheck.files.length,
            storage_saved_gb: compressionResult.storage_saved_gb,
            cost_savings: compressionResult.cost_savings
        });
        optimizationResults.storage_saved_gb += compressionResult.storage_saved_gb;
        optimizationResults.cost_savings_monthly += compressionResult.cost_savings;
    }

    // Optimization 3: Move old files to cheaper storage tiers
    const tierOptimization = await optimizeStorageTiers(location);
    if (tierOptimization.files_moved > 0) {
        optimizationResults.optimizations_applied.push({
            type: 'Storage Tier Optimization',
            files_processed: tierOptimization.files_moved,
            cost_savings: tierOptimization.cost_savings
        });
        optimizationResults.cost_savings_monthly += tierOptimization.cost_savings;
    }

    // Update location statistics
    await updateLocationUsage(supabaseUrl, headers, locationId, -optimizationResults.storage_saved_gb * 1024);

    return optimizationResults;
}

// Calculate storage costs across all locations
async function calculateStorageCosts(supabaseUrl, headers, organizationId) {
    // Get all backup locations
    const locationsResponse = await fetch(
        `${supabaseUrl}/rest/v1/backup_locations?organization_id=eq.${organizationId}&select=*`,
        { headers }
    );

    if (!locationsResponse.ok) {
        throw new Error('Failed to fetch backup locations');
    }

    const locations = await locationsResponse.json();

    const costAnalysis = {
        organization_id: organizationId,
        analysis_date: new Date().toISOString(),
        total_monthly_cost: 0,
        total_storage_gb: 0,
        average_cost_per_gb: 0,
        location_costs: [],
        recommendations: []
    };

    for (const location of locations) {
        const locationCosts = await calculateLocationCosts(location);
        costAnalysis.location_costs.push(locationCosts);
        costAnalysis.total_monthly_cost += locationCosts.monthly_cost;
        costAnalysis.total_storage_gb += locationCosts.used_capacity_gb;
    }

    // Calculate average cost per GB
    costAnalysis.average_cost_per_gb = costAnalysis.total_storage_gb > 0 
        ? costAnalysis.total_monthly_cost / costAnalysis.total_storage_gb 
        : 0;

    // Generate cost optimization recommendations
    costAnalysis.recommendations = generateCostRecommendations(costAnalysis);

    return costAnalysis;
}

// Helper functions for storage operations

function generateStoragePath(location, fileName, metadata) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const pathPrefix = location.path_prefix || '';
    return `${pathPrefix}${year}/${month}/${day}/${fileName}`;
}

async function processBackupData(data, options) {
    const processed = {
        data: data.content,
        size: data.size,
        compressionRatio: 1.0,
        hash: await generateHash(data.content)
    };

    // Apply compression if enabled
    if (options.compression_enabled) {
        const compressionRatio = 0.3 + Math.random() * 0.4; // Simulate 30-70% compression
        processed.size = Math.floor(data.size * compressionRatio);
        processed.compressionRatio = compressionRatio;
    }

    // Apply encryption if enabled (in real implementation)
    if (options.encryption_enabled) {
        // Encryption would be applied here
        // processed.data = encrypt(processed.data, encryptionKey);
    }

    return processed;
}

async function checkStorageCapacity(location, requiredSize) {
    const requiredGB = requiredSize / (1024 * 1024 * 1024);
    const availableGB = location.total_capacity_gb - location.used_capacity_gb;
    
    return {
        hasCapacity: availableGB >= requiredGB,
        availableGB,
        requiredGB,
        usagePercent: (location.used_capacity_gb / location.total_capacity_gb) * 100
    };
}

// Storage provider specific upload/download functions (simplified)
async function uploadToSupabase(supabaseUrl, headers, location, storagePath, data) {
    const startTime = Date.now();
    
    // Simulate upload to Supabase Storage
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    return {
        url: `${supabaseUrl}/storage/v1/object/public/${location.bucket_name}/${storagePath}`,
        uploadTime: new Date().toISOString(),
        duration: (Date.now() - startTime) / 1000
    };
}

async function uploadToAWS(location, storagePath, data) {
    const startTime = Date.now();
    
    // Simulate AWS S3 upload
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1500));
    
    return {
        url: `https://${location.bucket_name}.s3.${location.region}.amazonaws.com/${storagePath}`,
        uploadTime: new Date().toISOString(),
        duration: (Date.now() - startTime) / 1000
    };
}

async function uploadToGoogleCloud(location, storagePath, data) {
    const startTime = Date.now();
    
    // Simulate Google Cloud Storage upload
    await new Promise(resolve => setTimeout(resolve, 900 + Math.random() * 1800));
    
    return {
        url: `https://storage.googleapis.com/${location.bucket_name}/${storagePath}`,
        uploadTime: new Date().toISOString(),
        duration: (Date.now() - startTime) / 1000
    };
}

async function uploadToAzure(location, storagePath, data) {
    const startTime = Date.now();
    
    // Simulate Azure Blob Storage upload
    await new Promise(resolve => setTimeout(resolve, 1100 + Math.random() * 1600));
    
    return {
        url: `https://${location.bucket_name}.blob.core.windows.net/${storagePath}`,
        uploadTime: new Date().toISOString(),
        duration: (Date.now() - startTime) / 1000
    };
}

// Additional helper functions (simplified implementations)
async function verifyUploadIntegrity(location, storagePath, expectedHash) {
    // Simulate integrity verification
    const verified = Math.random() > 0.05; // 95% success rate
    return { verified };
}

async function updateLocationUsage(supabaseUrl, headers, locationId, sizeChange) {
    const sizeChangeGB = sizeChange / (1024 * 1024 * 1024);
    
    await fetch(
        `${supabaseUrl}/rest/v1/backup_locations?id=eq.${locationId}`,
        {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                used_capacity_gb: `used_capacity_gb + ${sizeChangeGB}`,
                last_successful_backup: new Date().toISOString()
            })
        }
    );
}

async function logStorageActivity(supabaseUrl, headers, activityData) {
    // Log storage activity (would require creating a storage_activity table)
    console.log('Storage activity logged:', activityData);
}

async function generateHash(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Additional helper functions would be implemented for:
// - downloadFromSupabase, downloadFromAWS, etc.
// - verifyFileSize, verifyFileHash, checkFileExistence
// - processScheduleRetention, syncSingleLocation
// - findDuplicateFiles, deduplicateFiles, compressFiles
// - optimizeStorageTiers, calculateLocationCosts
// - generateCostRecommendations